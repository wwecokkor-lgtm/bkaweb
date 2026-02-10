
import React, { useState, useEffect } from 'react';
import { useAppStore } from './store';
import { Modal, Button, Input, Spinner } from './commonComponents';
import { api } from './api';
import { NotificationType, Order, PaymentMethod } from './types';

const PaymentModal: React.FC = () => {
    const { isPaymentModalOpen, closePaymentModal, courseForPayment, user, addNotification, updateUser } = useAppStore();
    const [couponCode, setCouponCode] = useState('');
    const [finalPrice, setFinalPrice] = useState(0);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [transactionId, setTransactionId] = useState('');
    const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
    const [coinsToUse, setCoinsToUse] = useState(0);

    const price = courseForPayment?.discount ?? courseForPayment?.price ?? 0;

    useEffect(() => {
        if (isPaymentModalOpen) {
            api.getPaymentMethods().then(methods => {
                const activeMethods = methods.filter(m => m.status === 'Active');
                setPaymentMethods(activeMethods);
                setSelectedMethod(activeMethods[0] || null);
            });
        }
        if (courseForPayment) {
            setFinalPrice(price);
            setDiscountAmount(0); setCouponCode(''); setAppliedCoupon(null);
            setTransactionId(''); setScreenshotFile(null); setCoinsToUse(0);
        }
    }, [isPaymentModalOpen, courseForPayment, price]);

    useEffect(() => {
        const coinValue = Math.min(user?.coins || 0, price, coinsToUse);
        setFinalPrice(Math.max(0, price - discountAmount - coinValue));
    }, [coinsToUse, discountAmount, user, price]);

    const handleApplyCoupon = async () => {
        if (!couponCode || !courseForPayment) {
            addNotification('Please enter a coupon code.', NotificationType.ERROR);
            return;
        }
        setIsLoading(true);
        const res = await api.applyCoupon(couponCode, courseForPayment.price);
        setIsLoading(false);
        if (res.success) {
            setDiscountAmount(res.discountAmount);
            setAppliedCoupon(res.code.toUpperCase());
            addNotification(`Coupon "${res.code}" applied! You saved ৳${res.discountAmount}.`, NotificationType.SUCCESS);
        } else {
            addNotification(res.message, NotificationType.ERROR);
            setDiscountAmount(0);
            setAppliedCoupon(null);
        }
    };
    
    const handleSubmitPayment = async () => {
        if (!user || !courseForPayment || !selectedMethod) return;
        
        if (finalPrice === 0 && coinsToUse > 0 && discountAmount === 0 && !appliedCoupon) {
             setIsLoading(true);
             const res = await api.purchaseWithCoins(user.id, courseForPayment.id, coinsToUse);
             if (res.success && res.user) {
                 updateUser(res.user);
                 addNotification(res.message, NotificationType.SUCCESS);
                 closePaymentModal();
             } else {
                 addNotification(res.message, NotificationType.ERROR);
             }
             setIsLoading(false);
             return;
        }

        if (isManualPayment && !transactionId) {
            addNotification('Transaction ID is required.', NotificationType.ERROR);
            return;
        }

        setIsLoading(true);
        let screenshotUrl: string | undefined = undefined;
        if (screenshotFile) {
            const uploadRes = await api.uploadPhoto(screenshotFile);
            if (uploadRes.success) screenshotUrl = uploadRes.url;
            else { addNotification('Screenshot upload failed.', NotificationType.ERROR); setIsLoading(false); return; }
        }

        const res = await api.submitManualPayment({
            userId: user.id, courseId: courseForPayment.id, courseTitle: courseForPayment.title,
            amount: courseForPayment.price, finalAmount: finalPrice, paymentMethod: selectedMethod.name as Order['paymentMethod'],
            transactionId, screenshotUrl, couponCode: appliedCoupon || undefined, discountAmount: discountAmount || undefined
        });
        
        setIsLoading(false);
        addNotification(res.message, res.success ? NotificationType.SUCCESS : NotificationType.ERROR);
        if (res.success) closePaymentModal();
    };
    
    if (!courseForPayment || !user) return null;

    const isManualPayment = selectedMethod?.name === 'bKash' || selectedMethod?.name === 'Nagad';

    return (
        <Modal isOpen={isPaymentModalOpen} onClose={closePaymentModal} title="Complete Your Enrollment">
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Order Summary</h3>
                    <div className="bg-slate-700/50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between"><span className="text-slate-400">Course:</span><span className="font-medium text-white">{courseForPayment.title}</span></div>
                        <div className="flex justify-between"><span className="text-slate-400">Price:</span><span className="font-medium text-white">৳{price}</span></div>
                        {discountAmount > 0 && <div className="flex justify-between text-green-400"><span>Discount ({appliedCoupon}):</span><span className="font-medium">- ৳{discountAmount}</span></div>}
                        {coinsToUse > 0 && <div className="flex justify-between text-yellow-400"><span>Coins Used:</span><span className="font-medium">- ৳{coinsToUse}</span></div>}
                        <div className="border-t border-slate-600 my-2"></div>
                        <div className="flex justify-between text-xl"><span className="font-bold text-sky-400">Total:</span><span className="font-bold text-sky-400">৳{finalPrice}</span></div>
                    </div>
                </div>
                 {user.coins > 0 && <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Use Your Coins</h3>
                     <div className="bg-slate-700/50 p-4 rounded-lg space-y-2">
                         <p className="text-sm text-slate-300">You have <span className="font-bold text-yellow-400">{user.coins}</span> coins. (1 coin = ৳1)</p>
                         <div className="flex gap-2 items-center">
                            <input type="range" min="0" max={Math.min(user.coins, price)} value={coinsToUse} onChange={e => setCoinsToUse(Number(e.target.value))} className="w-full" />
                            <span className="w-16 text-center font-bold">{coinsToUse}</span>
                         </div>
                     </div>
                 </div>}
                <div>
                     <h3 className="text-lg font-semibold text-white mb-2">Coupon Code</h3>
                     <div className="flex gap-2"><Input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="e.g., SAVE10" /><Button variant="secondary" onClick={handleApplyCoupon} isLoading={isLoading}>Apply</Button></div>
                </div>
                {finalPrice > 0 && <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Select Payment Method</h3>
                    <div className="flex gap-3">{paymentMethods.map(method => (<button key={method.id} onClick={() => setSelectedMethod(method)} className={`flex-1 p-3 border-2 rounded-lg transition-colors ${selectedMethod?.id === method.id ? 'border-sky-500 bg-sky-500/10' : 'border-slate-600 hover:border-slate-500'}`}>{method.name}</button>))}</div>
                </div>}
                {finalPrice > 0 && isManualPayment && selectedMethod && (
                    <div className="bg-slate-700/50 p-4 rounded-lg space-y-4">
                        <h4 className="font-semibold text-white">Payment Instructions</h4>
                        <p className="text-sm text-slate-300">Please send <span className="font-bold text-sky-400">৳{finalPrice}</span> to the following {selectedMethod.name} number:</p>
                        <p className="text-center font-bold text-lg bg-slate-800 p-2 rounded-md text-white tracking-widest">{selectedMethod.accountNumber}</p>
                        <Input label="Transaction ID (TrxID)" value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="Enter your TrxID here" required />
                        <div><label className="block text-sm font-medium text-slate-300 mb-1">Payment Screenshot (Optional)</label><input type="file" accept="image/*" onChange={e => setScreenshotFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-sky-600/20 file:text-sky-400 hover:file:bg-sky-600/30"/></div>
                    </div>
                )}
                <Button className="w-full" onClick={handleSubmitPayment} isLoading={isLoading}>
                    {finalPrice > 0 ? (isManualPayment ? 'Submit for Verification' : `Pay ৳${finalPrice} and Enroll`) : `Enroll for Free`}
                </Button>
            </div>
        </Modal>
    );
};

export default PaymentModal;
