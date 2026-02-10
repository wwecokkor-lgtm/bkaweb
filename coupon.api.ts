
import type { Coupon } from './types';
import { mockCoupons, simulateDelay, logAdminAction, saveDB } from './db';

export const couponApi = {
    getCoupons: async (): Promise<Coupon[]> => {
        await simulateDelay(200);
        return [...mockCoupons];
    },
    createCoupon: async (adminId: string, couponData: Omit<Coupon, 'id' | 'createdAt' | 'timesUsed'>): Promise<{ success: boolean; coupon?: Coupon; message: string }> => {
        await simulateDelay(600);
        if (mockCoupons.some(c => c.code.toUpperCase() === couponData.code.toUpperCase())) {
            return { success: false, message: 'A coupon with this code already exists.' };
        }
        const newCoupon: Coupon = {
            ...couponData,
            id: `coupon-${Date.now()}`,
            createdAt: new Date(),
            timesUsed: 0,
        };
        mockCoupons.push(newCoupon);
        logAdminAction(adminId, `Created coupon: ${newCoupon.code}`, 'Coupon', newCoupon.id);
        saveDB();
        return { success: true, coupon: newCoupon, message: 'Coupon created successfully!' };
    },
    updateCoupon: async (adminId: string, couponId: string, couponData: Partial<Coupon>): Promise<{ success: boolean; coupon?: Coupon; message: string }> => {
        await simulateDelay(600);
        const index = mockCoupons.findIndex(c => c.id === couponId);
        if (index === -1) return { success: false, message: 'Coupon not found.' };
        
        // Prevent changing code if it already exists elsewhere
        if (couponData.code && mockCoupons.some(c => c.id !== couponId && c.code.toUpperCase() === couponData.code?.toUpperCase())) {
            return { success: false, message: 'Another coupon with this code already exists.' };
        }

        mockCoupons[index] = { ...mockCoupons[index], ...couponData };
        logAdminAction(adminId, `Updated coupon: ${mockCoupons[index].code}`, 'Coupon', couponId);
        saveDB();
        return { success: true, coupon: mockCoupons[index], message: 'Coupon updated successfully!' };
    },
    deleteCoupon: async (adminId: string, couponId: string): Promise<{ success: boolean; message: string }> => {
        await simulateDelay(500);
        const index = mockCoupons.findIndex(c => c.id === couponId);
        if (index === -1) return { success: false, message: 'Coupon not found.' };
        const code = mockCoupons[index].code;
        mockCoupons.splice(index, 1);
        logAdminAction(adminId, `Deleted coupon: ${code}`, 'Coupon', couponId);
        saveDB();
        return { success: true, message: 'Coupon deleted successfully.' };
    },
    applyCoupon: async (code: string, originalPrice: number): Promise<{ success: boolean; discountAmount: number; code: string; message: string; }> => {
        await simulateDelay(400);
        const coupon = mockCoupons.find(c => c.code.toUpperCase() === code.toUpperCase());

        if (!coupon) return { success: false, discountAmount: 0, code, message: 'Invalid coupon code.' };
        if (!coupon.isActive) return { success: false, discountAmount: 0, code, message: 'This coupon is no longer active.' };
        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return { success: false, discountAmount: 0, code, message: 'This coupon has expired.' };
        if (coupon.usageLimit > 0 && coupon.timesUsed >= coupon.usageLimit) return { success: false, discountAmount: 0, code, message: 'This coupon has reached its usage limit.' };

        let discountAmount = 0;
        if (coupon.discountType === 'Fixed') {
            discountAmount = Math.min(originalPrice, coupon.discountValue);
        } else if (coupon.discountType === 'Percentage') {
            discountAmount = Math.round(originalPrice * (coupon.discountValue / 100));
        }
        
        // Don't actually increment timesUsed here, do it when the order is completed.
        // This is a check, not the final application.

        return { success: true, discountAmount, code: coupon.code, message: 'Coupon applied!' };
    }
};
