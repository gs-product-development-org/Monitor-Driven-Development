// // frontend/src/hooks/useSessionNavigation.ts
// 'use client';

// import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { supabase } from '@/lib/supabase';

// export function useSessionNavigation(classId: string) {
//   const router = useRouter();

//   useEffect(() => {
//     if (!classId) return;

//     // クラスごとのチャンネルを作成
//     const channel = supabase.channel(`class-session-${classId}`);

//     // 教師からの Broadcast イベント（navigate）を購読
//     channel
//       .on('broadcast', { event: 'navigate' }, (payload) => {
//         // payload.nextPath に指定された画面パスへ自動遷移
//         if (payload.nextPath) {
//           router.push(payload.nextPath);
//         }
//       })
//       .subscribe();

//     // 画面を離れたら接続を解除
//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [classId, router]);
// }