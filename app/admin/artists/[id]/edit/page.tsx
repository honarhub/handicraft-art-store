'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import SpecialtyTagInput, { Specialty } from '../../../../components/SpecialtyTagInput';

export default function EditArtistPage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [bio, setBio] = useState('');
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/artists/${id}`)
      .then(res => res.json())
      .then(data => {
        setName(data.user?.name || '');
        setSpecialties(data.specialties || []);
        setBio(data.bio || '');
        if (data.user?.image) {
          setAvatarBase64(data.user.image);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setAvatarBase64(base64);
    }
  };

  const submitEditArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/artists/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          name,
          specialties: specialties.map(s => s.id),
          bio,
          avatar: avatarBase64
        })
      });
      
      if (!res.ok) throw new Error('خطا در بروزرسانی هنرمند');
      
      alert('پروفایل هنرمند با موفقیت ویرایش شد!');
      window.location.href = '/admin/artists';
    } catch(err) {
      alert('مشکلی در بروزرسانی هنرمند به وجود آمد.');
    }
  };

  if (loading) return <div className="p-8 text-center" dir="rtl">در حال دریافت اطلاعات...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto" dir="rtl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800">ویرایش پروفایل هنرمند</h2>
          <p className="text-slate-500 mt-1 text-sm">شما در حال ویرایش اطلاعات این هنرمند هستید.</p>
        </div>
        <a href="/admin/artists" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm transition-colors">
          بازگشت به لیست
        </a>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 md:p-8">
        <form onSubmit={submitEditArtist} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">نام و نام خانوادگی</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">تخصص‌ها</label>
              <SpecialtyTagInput selectedSpecialties={specialties} onChange={setSpecialties} />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">عکس پروفایل</label>
            <div className="flex items-center gap-4">
              {avatarBase64 && <img src={avatarBase64} alt="Preview" className="w-12 h-12 rounded-full object-cover border" />}
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">معرفی‌نامه (بیوگرافی)</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none leading-relaxed" rows={6} required></textarea>
          </div>

          <div className="pt-4 border-t border-slate-100 flex gap-4">
            <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all">
              ثبت تغییرات و ذخیره
            </button>
            <a href="/admin/artists" className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-6 rounded-xl transition-all text-center">
              انصراف
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
