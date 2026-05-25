import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, CartStore } from '../types';

// توليد معرّف فريد مختصر
const generateId = () => Math.random().toString(36).substring(2, 9);

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      _hasHydrated: false,
      setHasHydrated: (val: boolean) => set({ _hasHydrated: val }),
      toggleCart: () => set({ isOpen: !get().isOpen }),

      addToCart: (product, quantity) => {
        const currentItems = get().items;

        // تحديد ما إذا كان المنتج طلباً مسبقاً (Pre-order)
        const isPreorder = product.allow_preorder === true;

        // التحقق من وجود نفس المنتج بنفس الملاحظة
        const existingItem = currentItems.find(
          item => item.id === product.id && item.note === product.note
        );

        if (existingItem) {
          set({
            items: currentItems.map(item =>
              item.cartItemId === existingItem.cartItemId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
          const newItem: import('../types').CartItem = {
            id: product.id,
            cartItemId: generateId(),
            name: product.name_ar || product.name_en || product.name,
            price: product.price,
            quantity,
            image_url: product.image_url ?? undefined,
            stock: product.stock,
            note: product.note ?? undefined,
            is_preorder: isPreorder,
            restock_date: isPreorder ? (product.restock_date ?? null) : undefined,
          };
          set({ items: [...currentItems, newItem] });
        }
      },

      removeFromCart: (cartItemId) => set({ items: get().items.filter(item => item.cartItemId !== cartItemId) }),

      updateQuantity: (cartItemId, quantity) => set({
        items: get().items.map(item => item.cartItemId === cartItemId ? { ...item, quantity } : item)
      }),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'candyhon-cart-storage',
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
