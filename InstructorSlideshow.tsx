
import React, { useState, useEffect } from 'react';
import { Card } from './commonComponents';
import type { Instructor, InstructorSlide } from './types';

interface InstructorSlideshowProps {
    instructors: Instructor[];
}

const InstructorSlideshow: React.FC<InstructorSlideshowProps> = ({ instructors }) => {
    const [currentInstructorIndex, setCurrentInstructorIndex] = useState(0);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(-1); // -1 means show main profile

    const instructor = instructors[currentInstructorIndex];
    
    // Combine profile and slides into one array for easier navigation
    const allSlides = [
        { type: 'profile', ...instructor },
        ...instructor.slides.map(s => ({ type: 'slide', ...s }))
    ];

    const totalSlides = allSlides.length;

    const nextSlide = () => {
        setCurrentSlideIndex(prev => (prev + 1) % totalSlides);
    };

    const prevSlide = () => {
        setCurrentSlideIndex(prev => (prev - 1 + totalSlides) % totalSlides);
    };

    // Auto-advance
    useEffect(() => {
        const timer = setTimeout(nextSlide, 5000);
        return () => clearTimeout(timer);
    }, [currentSlideIndex]);
    
    const currentContent = allSlides[currentSlideIndex];

    if (!instructor) return null;
    
    // Initial render should show profile
    if (currentSlideIndex === -1) {
        setCurrentSlideIndex(0);
        return null;
    }

    return (
        <Card>
            <h2 className="text-2xl font-bold mb-4">About Your Instructor</h2>
            <div className="relative flex flex-col md:flex-row items-center gap-6 bg-slate-700/50 p-6 rounded-lg min-h-[250px] overflow-hidden">
                {/* Navigation Buttons */}
                <button onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/30 p-2 rounded-full hover:bg-black/50">&lt;</button>
                <button onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/30 p-2 rounded-full hover:bg-black/50">&gt;</button>
                
                {currentContent.type === 'profile' && (
                     <>
                        <img src={instructor.photoUrl} alt={instructor.name} className="w-32 h-32 rounded-full object-cover border-4 border-slate-600 flex-shrink-0" />
                        <div className="text-center md:text-left">
                            <div className="flex items-center gap-2 justify-center md:justify-start">
                                <h3 className="text-2xl font-bold text-white">{instructor.name}</h3>
                                {instructor.isVerified && (
                                    <span title="Verified Instructor" className="bg-sky-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                    </span>
                                )}
                            </div>
                            <p className="text-sky-400 font-semibold">{instructor.title}</p>
                            <p className="text-slate-300 text-sm mt-1">{instructor.degrees}</p>
                            <p className="text-slate-400 text-sm">{instructor.experience}</p>
                        </div>
                    </>
                )}

                {currentContent.type === 'slide' && (
                    <div className="flex flex-col md:flex-row items-center gap-6 w-full">
                        {currentContent.imageUrl && <img src={currentContent.imageUrl} alt={currentContent.title} className="w-full md:w-1/3 h-32 object-cover rounded-md flex-shrink-0" />}
                        <div className="text-center md:text-left">
                             <h4 className="text-xl font-bold text-white">{currentContent.title}</h4>
                             <p className="text-slate-300 mt-2">{currentContent.content}</p>
                        </div>
                    </div>
                )}
                 
                 {/* Dots */}
                 <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                    {allSlides.map((_, index) => (
                        <button key={index} onClick={() => setCurrentSlideIndex(index)} className={`w-2 h-2 rounded-full ${index === currentSlideIndex ? 'bg-sky-400' : 'bg-slate-500'}`}></button>
                    ))}
                 </div>
            </div>
        </Card>
    );
};

export default InstructorSlideshow;
