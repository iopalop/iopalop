import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "./api";
import { Lang } from "./i18n";

interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  is_admin: boolean;
}

interface CartItem {
  product_id: string;
  name_ar: string;
  name_en: string;
  price_iqd: number;
  image_url: string;
  quantity: number;
  size?: string;
  color?: string;
}

interface AppContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  user: User | null;
  authLoading: boolean;
  setUser: (u: User | null) => void;
  setToken: (t: string) => Promise<void>;
  logout: () => Promise<void>;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (idx: number) => void;
  updateQty: (idx: number, qty: number) => void;
  clearCart: () => void;
  cartCount: number;
}

const Ctx = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Initial load
  useEffect(() => {
    (async () => {
      const storedLang = (await AsyncStorage.getItem("lang")) as Lang | null;
      if (storedLang) setLangState(storedLang);
      const cartStr = await AsyncStorage.getItem("cart");
      if (cartStr) setCart(JSON.parse(cartStr));
      const token = await AsyncStorage.getItem("auth_token");
      if (token) {
        try {
          const me = await api.get("/auth/me");
          setUser(me);
        } catch {
          await AsyncStorage.removeItem("auth_token");
        }
      }
      setAuthLoading(false);
    })();
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem("lang", l);
  }, []);

  const setToken = useCallback(async (t: string) => {
    await AsyncStorage.setItem("auth_token", t);
    const me = await api.get("/auth/me");
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    try { await api.post("/auth/logout", {}); } catch {}
    await AsyncStorage.removeItem("auth_token");
    setUser(null);
  }, []);

  const persistCart = (next: CartItem[]) => {
    setCart(next);
    AsyncStorage.setItem("cart", JSON.stringify(next));
  };

  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => {
      const idx = prev.findIndex(
        (p) => p.product_id === item.product_id && p.size === item.size && p.color === item.color
      );
      let next: CartItem[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
      } else {
        next = [...prev, item];
      }
      AsyncStorage.setItem("cart", JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFromCart = useCallback((idx: number) => {
    setCart((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      AsyncStorage.setItem("cart", JSON.stringify(next));
      return next;
    });
  }, []);

  const updateQty = useCallback((idx: number, qty: number) => {
    setCart((prev) => {
      const next = [...prev];
      if (qty <= 0) {
        next.splice(idx, 1);
      } else {
        next[idx] = { ...next[idx], quantity: qty };
      }
      AsyncStorage.setItem("cart", JSON.stringify(next));
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    AsyncStorage.removeItem("cart");
  }, []);

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <Ctx.Provider
      value={{
        lang,
        setLang,
        user,
        authLoading,
        setUser,
        setToken,
        logout,
        cart,
        addToCart,
        removeFromCart,
        updateQty,
        clearCart,
        cartCount,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
