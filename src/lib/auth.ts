import { getSupabase } from "./supabase";

export async function signInAdmin(email: string, password: string) {
  const { data, error } = await getSupabase().auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw new Error("Invalid email or password.");
  }

  if (!data.session) {
    throw new Error("Login failed — no session returned. Check your email and password.");
  }

  return data.session;
}

export async function signOutAdmin() {
  const { error } = await getSupabase().auth.signOut();
  if (error) {
    console.error("[signOutAdmin]", error.message);
    throw new Error("Could not sign out. Please try again.");
  }
}

export async function getAdminSession() {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) return null;
  return data.session;
}

export function onAuthStateChange(callback: (loggedIn: boolean) => void) {
  return getSupabase().auth.onAuthStateChange((_event, session) => {
    callback(!!session);
  });
}
