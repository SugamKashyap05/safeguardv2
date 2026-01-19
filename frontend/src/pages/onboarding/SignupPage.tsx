import React, { useState } from 'react';
import { OnboardingLayout } from '../../components/layouts/OnboardingLayout';
import { AccountStep } from './steps/AccountStep';
import { FamilyStep } from './steps/FamilyStep';
import { ChildProfileStep } from './steps/ChildProfileStep';
import { TutorialStep } from './steps/TutorialStep';

export const SignupWizard = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        // Auth
        email: '',
        password: '',
        name: '',
        // Family
        childCount: 1,
        tier: 'free',
        // First Child
        childName: '',
        childAge: 5,
        childPin: '',
    });

    const updateData = (data: Partial<typeof formData>) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    const nextStep = () => setStep(prev => Math.min(prev + 1, 4));

    // Config for each step's layout title/subtitle
    const stepConfig = {
        1: { title: "Let's Get Started!", subtitle: "Create your parent account to safeguard your little ones." },
        2: { title: "Customize Your Family", subtitle: "Tell us a bit about who will be watching." },
        3: { title: "First Adventurer", subtitle: "Set up a profile for your first child." },
        4: { title: "You're All Set!", subtitle: "Here's a quick tour of your superpowers." },
    }[step as 1 | 2 | 3 | 4];

    return (
        <OnboardingLayout
            step={step}
            totalSteps={4}
            title={stepConfig.title}
            subtitle={stepConfig.subtitle}
        >
            {step === 1 && <AccountStep onNext={(data: any) => { updateData(data); nextStep(); }} />}
            {step === 2 && <FamilyStep onNext={(data: any) => { updateData(data); nextStep(); }} />}
            {step === 3 && <ChildProfileStep onNext={(data: any) => { updateData(data); nextStep(); }} />}
            {step === 4 && <TutorialStep onFinish={() => alert('Done! Redirecting...')} />}
        </OnboardingLayout>
    );
};
