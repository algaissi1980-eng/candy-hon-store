'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import { toast } from 'sonner';

interface AdminAdminsTabProps {
  adminsList: any[];
  currentUserEmail: string;
  lang: 'ar' | 'en';
  fetchAdminsList: () => void;
}

const OWNER_EMAIL = process.env.NEXT_PUBLIC_OWNER_EMAIL || 'algaissi1980@gmail.com';

export default function AdminAdminsTab({ adminsList, currentUserEmail, lang, fetchAdminsList }: AdminAdminsTabProps) {
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);

  const t = {
    addTitle: lang === 'ar' ? 'إضافة مدير جديد' : 'Add New Admin',
    addDesc: lang === 'ar' ? 'أدخل البريد الإلكتروني للشخص الذي تريده أن يدير المتجر معك.' : 'Enter the email of the person you want to co-manage the store.',
    placeholder: 'admin@example.com',
    addBtn: lang === 'ar' ? 'إضافة ➕' : 'Add ➕',
    currentList: lang === 'ar' ? 'المدراء الحاليون' : 'Current Admins',
    mainOwner: lang === 'ar' ? 'المالك الأساسي 👑' : 'Main Owner 👑',
    you: lang === 'ar' ? 'أنت' : 'You',
    revokeBtn: lang === 'ar' ? 'سحب الصلاحية 🗑️' : 'Revoke Access 🗑️',
    successAdd: lang === 'ar' ? 'تمت إضافة المدير بنجاح!' : 'Admin added successfully!',
    errorAdd: lang === 'ar' ? 'حدث خطأ، ربما هذا الإيميل موجود مسبقاً.' : 'Error, email might already exist.',
    errorRevokeOwner: lang === 'ar' ? 'لا يمكنك سحب الصلاحية من المالك الأساسي للمتجر! 👑🚫' : 'Cannot revoke main owner access! 👑🚫',
    errorRevokeSelf: lang === 'ar' ? 'عذراً، لا يمكنك حذف حسابك الشخصي! 🚫' : 'Cannot delete your own account! 🚫',
    confirmRevoke: lang === 'ar' ? 'هل أنت متأكد من سحب الصلاحيات من هذا المدير؟ 🗑️' : 'Are you sure you want to revoke access? 🗑️',
    errorDelete: lang === 'ar' ? 'تعذر الحذف! ' : 'Deletion failed! '
  };

  const isOwner = currentUserEmail.toLowerCase() === OWNER_EMAIL.toLowerCase();

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail || !isOwner) return;
    setIsSavingAdmin(true);
    const { error } = await supabase.from('admins').insert({ email: newAdminEmail.toLowerCase().trim() });
    if (!error) { toast.success(t.successAdd); setNewAdminEmail(''); fetchAdminsList(); }
    else toast.error(t.errorAdd);
    setIsSavingAdmin(false);
  };

  const handleDeleteAdmin = async (emailToDelete: string) => {
    if (emailToDelete.toLowerCase() === OWNER_EMAIL.toLowerCase()) return toast.error(t.errorRevokeOwner);
    if (emailToDelete.toLowerCase() === currentUserEmail.toLowerCase()) return toast.error(t.errorRevokeSelf);
    // فقط المالك يقدر يحذف مدراء آخرين
    if (currentUserEmail.toLowerCase() !== OWNER_EMAIL.toLowerCase()) return toast.error(t.errorRevokeOwner);
    if (window.confirm(t.confirmRevoke)) {
      const { error } = await supabase.from('admins').delete().eq('email', emailToDelete);
      if (error) toast.error(t.errorDelete + error.message);
      else fetchAdminsList();
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* فقط المالك يقدر يضيف مدراء جدد */}
      {isOwner && (
        <div className="bg-white p-8 border border-gray-200 mb-8 shadow-sm">
          <h2 className="text-xl font-black text-black mb-2">{t.addTitle}</h2>
          <p className="text-sm text-gray-500 mb-6">{t.addDesc}</p>
          <form onSubmit={handleAddAdmin} className="flex gap-4 items-end">
            <div className="flex-grow">
              <input type="email" required value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} placeholder={t.placeholder} className="w-full border-b border-gray-300 p-2 outline-none focus:border-black" dir="ltr" />
            </div>
            <button disabled={isSavingAdmin} className="bg-black text-white font-bold px-8 py-3 hover:bg-gray-800 transition disabled:bg-gray-400">{t.addBtn}</button>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 overflow-hidden shadow-sm">
        <h2 className="text-xl font-black text-black p-6 border-b border-gray-100 bg-gray-50">{t.currentList}</h2>
        <ul className="divide-y divide-gray-100">
          {adminsList.map((admin, index) => {
            const adminEmail = admin.email ? admin.email.toLowerCase() : '';
            const ownerEmail = OWNER_EMAIL.toLowerCase();
            const myEmail = currentUserEmail.toLowerCase();
            const isOwner = adminEmail === ownerEmail;
            const isMe = adminEmail === myEmail;
            const canDelete = myEmail === ownerEmail && !isOwner && !isMe;

            return (
              <li key={adminEmail || index} className="p-6 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <span className="font-mono text-lg font-bold text-gray-800" dir="ltr">{admin.email}</span>
                <div className="flex gap-2">
                  {isOwner && <span className="bg-yellow-100 text-yellow-800 px-3 py-1 text-xs font-bold rounded border border-yellow-300 shadow-sm">{t.mainOwner}</span>}
                  {isMe && !isOwner && <span className="bg-green-100 text-green-700 px-3 py-1 text-xs font-bold rounded border border-green-300">{t.you}</span>}
                  {canDelete && <button onClick={() => handleDeleteAdmin(admin.email)} className="text-red-500 hover:text-red-700 font-bold text-sm bg-red-50 hover:bg-red-100 px-4 py-2 rounded transition-colors">{t.revokeBtn}</button>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
