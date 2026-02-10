
import React, { useState } from 'react';
import { Modal, Button } from './commonComponents';
import type { InstructionContent } from './types';

interface InstructionPopupProps {
    content: InstructionContent;
    onAgree: () => void;
}

const InstructionPopup: React.FC<InstructionPopupProps> = ({ content, onAgree }) => {
    const [hasAgreed, setHasAgreed] = useState(false);

    return (
        <Modal isOpen={true} onClose={() => {}} title={content.title}>
            <div className="space-y-4">
                <div className="prose prose-invert max-h-64 overflow-y-auto pr-2 text-slate-300">
                   <p>{content.content}</p>
                </div>

                <div className="flex items-start pt-4 border-t border-slate-700">
                    <input 
                        id="agree-checkbox" 
                        type="checkbox" 
                        checked={hasAgreed}
                        onChange={e => setHasAgreed(e.target.checked)}
                        className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-600 rounded mt-1" 
                    />
                    <label htmlFor="agree-checkbox" className="ml-3 text-sm text-slate-300">
                        I have read and agree to the terms and instructions provided above.
                    </label>
                </div>

                <div className="flex justify-end pt-2">
                    <Button onClick={onAgree} disabled={!hasAgreed}>
                        Continue to Website
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default InstructionPopup;
