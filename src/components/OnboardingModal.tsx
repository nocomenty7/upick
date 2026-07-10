'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface OnboardingModalProps {
  onComplete: (data: { gender: string; age_group: string }) => void;
}

const GENDERS = ['남성', '여성'];
const AGE_GROUPS = ['10대', '20대', '30대', '40대', '50대', '60대', '70대 이상'];

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [selectedAge, setSelectedAge] = useState<string>('');

  const handleGenderSelect = (gender: string) => {
    setSelectedGender(gender);
    setStep(2);
  };

  const handleAgeSelect = (age: string) => {
    setSelectedAge(age);
    // Complete onboarding
    onComplete({ gender: selectedGender, age_group: age });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-sm overflow-hidden rounded-3xl bg-neutral-900/90 border border-neutral-800 p-6 text-center text-white shadow-2xl backdrop-blur-xl"
      >
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center">
          <div className="relative h-16 w-16 mb-2 overflow-hidden rounded-2xl bg-white/10 p-2">
            <Image
              src="/logo.jpg"
              alt="BALS Logo"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">BALS Balance Game</h2>
          <p className="text-xs text-neutral-400 mt-1">더 재미있는 밸런스 게임을 위한 간단한 프로필 설정</p>
        </div>

        {/* Step Indicator */}
        <div className="mb-6 flex justify-center gap-1.5">
          <div className={`h-1.5 w-8 rounded-full transition-colors ${step === 1 ? 'bg-white' : 'bg-neutral-700'}`} />
          <div className={`h-1.5 w-8 rounded-full transition-colors ${step === 2 ? 'bg-white' : 'bg-neutral-700'}`} />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step-gender"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              <h3 className="text-lg font-semibold mb-2">성별을 선택해주세요</h3>
              <div className="grid grid-cols-2 gap-3">
                {GENDERS.map((gender) => (
                  <motion.button
                    key={gender}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleGenderSelect(gender)}
                    className="flex h-24 flex-col items-center justify-center rounded-2xl bg-neutral-800/60 border border-neutral-700/60 hover:bg-neutral-800 hover:border-neutral-500 transition text-base font-medium text-neutral-200 hover:text-white"
                  >
                    <span className="text-2xl mb-1">{gender === '남성' ? '🙋‍♂️' : '🙋‍♀️'}</span>
                    {gender}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step-age"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              <h3 className="text-lg font-semibold mb-2">연령대를 선택해주세요</h3>
              <div className="grid grid-cols-3 gap-2">
                {AGE_GROUPS.map((age) => (
                  <motion.button
                    key={age}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleAgeSelect(age)}
                    className="flex h-12 items-center justify-center rounded-xl bg-neutral-800/60 border border-neutral-700/60 hover:bg-neutral-800 hover:border-neutral-500 transition text-sm font-medium text-neutral-200 hover:text-white"
                  >
                    {age}
                  </motion.button>
                ))}
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-xs text-neutral-500 hover:text-neutral-300 mt-4 transition underline underline-offset-4"
              >
                이전 단계로
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
