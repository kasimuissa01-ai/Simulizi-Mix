import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc,
  collection,
  onSnapshot 
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { Story } from "../data/stories";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  publicStories: Story[];
  userProfile: {
    displayName: string;
    favorites: string[];
    customStories: Story[];
  } | null;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateFavoritesInCloud: (favs: string[]) => Promise<void>;
  addCustomStoryToCloud: (story: Story) => Promise<void>;
  deleteCustomStoryFromCloud: (storyId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [publicStories, setPublicStories] = useState<Story[]>([]);
  const [userProfile, setUserProfile] = useState<{
    displayName: string;
    favorites: string[];
    customStories: Story[];
  } | null>(null);

  // 1. Listen to global top-level public "stories" collection in Firestore
  useEffect(() => {
    const storiesCol = collection(db, "stories");
    const unsubscribeStories = onSnapshot(storiesCol, (snapshot) => {
      const fetched: Story[] = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as Story;
          fetched.push({ ...data, id: data.id || docSnap.id });
        }
      });
      setPublicStories(fetched);
    }, (err) => {
      console.error("Error fetching Firestore stories collection:", err);
    });

    return () => unsubscribeStories();
  }, []);

  // 2. Sync auth state from Firebase
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (!currentUser) {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // 3. Listen to user document updates when logged in
  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, "users", user.uid);
    
    // Subscribe to changes
    const unsubscribeSnapshot = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile({
          displayName: data.displayName || user.displayName || "Avid Listener",
          favorites: data.favorites || [],
          customStories: data.customStories || []
        });
      } else {
        // Create initial document
        const initialProfile = {
          displayName: user.displayName || "Avid Listener",
          favorites: [],
          customStories: []
        };
        await setDoc(docRef, initialProfile);
        setUserProfile(initialProfile);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error reading user Firestore profile", error);
      setLoading(false);
    });

    return () => unsubscribeSnapshot();
  }, [user]);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const register = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    
    // Set Firestore profile
    const docRef = doc(db, "users", cred.user.uid);
    await setDoc(docRef, {
      displayName: name,
      favorites: [],
      customStories: []
    });
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateFavoritesInCloud = async (favs: string[]) => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid);
    await setDoc(docRef, { favorites: favs }, { merge: true });
  };

  const addCustomStoryToCloud = async (story: Story) => {
    try {
      // 1. Add to global public "stories" collection so everyone can listen on all domains (Vercel, custom domain)
      const storyDocRef = doc(db, "stories", story.id);
      await setDoc(storyDocRef, story, { merge: true });

      // 2. Add to user's profile customStories array if logged in
      if (user && userProfile) {
        const userDocRef = doc(db, "users", user.uid);
        const updatedStories = [...userProfile.customStories.filter(s => s.id !== story.id), story];
        await setDoc(userDocRef, { customStories: updatedStories }, { merge: true });
      }
    } catch (e: any) {
      console.error("Error saving story to Cloud Firestore:", e);
      if (e.message?.includes("too large") || e.code === "invalid-argument") {
        throw new Error("Story file size is too large for database documents. Please connect Supabase in Settings or enter an audio stream URL so files are hosted on universal cloud storage.");
      }
      throw e;
    }
  };

  const deleteCustomStoryFromCloud = async (storyId: string) => {
    // 1. Delete from global public "stories" collection
    try {
      await deleteDoc(doc(db, "stories", storyId));
    } catch (e) {
      console.error("Error deleting story from public collection:", e);
    }

    // 2. Delete from user profile
    if (user && userProfile) {
      const docRef = doc(db, "users", user.uid);
      const updatedStories = userProfile.customStories.filter(s => s.id !== storyId);
      await setDoc(docRef, { customStories: updatedStories }, { merge: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        publicStories,
        userProfile,
        login,
        loginWithGoogle,
        register,
        logout,
        updateFavoritesInCloud,
        addCustomStoryToCloud,
        deleteCustomStoryFromCloud
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

