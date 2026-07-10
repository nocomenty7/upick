'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Users, PieChart } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface StatsBottomSheetProps {
  questionId: string;
  onClose: () => void;
}

interface VoteStats {
  gender: {
    male: number;
    female: number;
    malePercent: number;
    femalePercent: number;
  };
  ageGroups: {
    name: string;
    count: number;
    percent: number;
  }[];
  totalVotes: number;
}

export default function StatsBottomSheet({ questionId, onClose }: StatsBottomSheetProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VoteStats | null>(null);

  useEffect(() => {
    // Enable AdSense script execution in case middle ad needs it
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense trigger failed inside stats bottom sheet: ", e);
    }

    async function fetchStats() {
      try {
        const { data, error } = await supabase
          .from('votes')
          .select('gender, age_group')
          .eq('question_id', questionId);

        if (error) throw error;

        if (!data || data.length === 0) {
          setStats({
            gender: { male: 0, female: 0, malePercent: 50, femalePercent: 50 },
            ageGroups: [],
            totalVotes: 0
          });
          setLoading(false);
          return;
        }

        const totalVotes = data.length;
        let male = 0;
        let female = 0;
        const ageMap: Record<string, number> = {
          '10대': 0, '20대': 0, '30대': 0, '40대': 0, '50대': 0, '60대': 0, '70대 이상': 0
        };

        data.forEach((row) => {
          if (row.gender === '남성') male++;
          else if (row.gender === '여성') female++;

          if (ageMap[row.age_group] !== undefined) {
            ageMap[row.age_group]++;
          }
        });

        const malePercent = Math.round((male / (male + female || 1)) * 100);
        const femalePercent = 100 - malePercent;

        const ageGroups = Object.keys(ageMap).map((key) => ({
          name: key,
          count: ageMap[key],
          percent: Math.round((ageMap[key] / totalVotes) * 100)
        }));

        setStats({
          gender: { male, female, malePercent, femalePercent },
          ageGroups,
          totalVotes
        });
      } catch (err) {
        console.error('Error fetching statistics:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [questionId]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      {/* Backdrop Click to Close */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative z-10 w-full max-w-md rounded-t-3xl bg-neutral-900/95 border-t border-neutral-800 p-6 text-white shadow-2xl backdrop-blur-xl flex flex-col max-h-[85dvh] overflow-y-auto"
      >
        {/* Header indicator */}
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-neutral-700" onClick={onClose} />

        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-neutral-400" />
            실시간 상세 통계
          </h3>
          <button
            onClick={onClose}
            className="rounded-full bg-neutral-800 p-1.5 text-neutral-400 hover:bg-neutral-700 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            <p className="text-sm text-neutral-500">통계 데이터를 불러오는 중...</p>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="text-center bg-neutral-800/40 border border-neutral-850 rounded-2xl p-4">
              <span className="text-xs text-neutral-400 block mb-0.5">전체 참여자 수</span>
              <span className="text-3xl font-black text-white">{stats.totalVotes.toLocaleString()}</span>
              <span className="text-xs text-neutral-400"> 명 투표 완료</span>
            </div>

            {/* Gender Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-neutral-300 flex items-center gap-1.5">
                <PieChart className="h-4 w-4" /> 성별 비율
              </h4>
              <div className="relative flex h-8 w-full overflow-hidden rounded-xl bg-neutral-800 font-bold text-xs">
                {stats.gender.malePercent > 0 && (
                  <div
                    style={{ width: `${stats.gender.malePercent}%` }}
                    className="flex h-full items-center justify-start bg-sky-500/80 px-3 text-white transition-all duration-500"
                  >
                    남성 {stats.gender.malePercent}%
                  </div>
                )}
                {stats.gender.femalePercent > 0 && (
                  <div
                    style={{ width: `${stats.gender.femalePercent}%` }}
                    className="flex h-full items-center justify-end bg-rose-500/80 px-3 text-white transition-all duration-500"
                  >
                    여성 {stats.gender.femalePercent}%
                  </div>
                )}
              </div>
            </div>

            {/* Age Group Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-neutral-300">연령별 비율</h4>
              <div className="space-y-2">
                {stats.ageGroups.map((group) => (
                  <div key={group.name} className="flex items-center gap-3 text-xs">
                    <span className="w-14 text-neutral-400 font-medium">{group.name}</span>
                    <div className="flex-1 h-2 bg-neutral-850 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${group.percent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-neutral-200"
                      />
                    </div>
                    <span className="w-8 text-right font-bold text-neutral-200">{group.percent}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AdSense Middle Slot (250px min height) */}
            <div className="pt-4 border-t border-neutral-800 flex justify-center">
              <div className="adsense-slot adsense-middle" style={{ minHeight: '250px', width: '100%', margin: '10px 0' }}>
                <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3522634980237009" crossOrigin="anonymous"></script>
                <ins className="adsbygoogle"
                     style={{ display: 'block' }}
                     data-ad-client="ca-pub-3522634980237009"
                     data-ad-slot="8623308627"
                     data-ad-format="auto"
                     data-full-width-responsive="true"></ins>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-neutral-500">통계 데이터를 불러올 수 없습니다.</div>
        )}
      </motion.div>
    </div>
  );
}
