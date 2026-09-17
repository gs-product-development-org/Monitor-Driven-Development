'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
    const [status, setStatus] = useState<string>('データ取得中...')
    const [firstRow, setFirstRow] = useState<any>(null)

    useEffect(() => {
        async function fetchFirstRow() {
            try {
                // classes テーブルから全カラムを対象に1行だけ取得する
                const { data, error } = await supabase
                    .from('classes')
                    .select('*')
                    .limit(1)

                if (error) {
                    setStatus(`⚠️ エラーが発生しました: ${error.message}`)
                    return
                }

                if (data && data.length > 0) {
                    setFirstRow(data[0])
                    setStatus('✅ 1行目のデータの取得に成功しました！')
                } else {
                    setStatus('ℹ️ classes テーブルにデータが存在しません。')
                }
            } catch (err) {
                setStatus(`❌ 取得に失敗しました: ${err}`)
            }
        }

        fetchFirstRow()
    }, [])

    return (
        <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
            <h1>Supabase データ取得テスト</h1>
            <p style={{ fontSize: '1.2rem', marginTop: '1rem' }}>{status}</p>

            {/* 1行目の全情報（オブジェクト）が存在する場合に画面に表示する */}
            {firstRow && (
                <div style={{ marginTop: '1.5rem' }}>
                    <h2>取得した1行目の全情報:</h2>
                    <pre style={{ background: '#f4f4f4', padding: '1rem', borderRadius: '8px', overflowX: 'auto' }}>
                        {JSON.stringify(firstRow, null, 2)}
                    </pre>
                </div>
            )}
        </main>
    )
}