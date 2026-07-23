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
  onSnapshot 
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { Story } from "../data/stories";

interface AuthContextType {
  user: User | null;
  loading: boolean;
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
  const [userProfile, setUserProfile] = useState<{
    displayName: string;
    favorites: string[];
    customStories: Story[];
  } | null>(null);

  // Sync profile from Firestore
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

  // Listen to Firestore document updates when logged in
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
    if (!user || !userProfile) return;
    const docRef = doc(db, "users", user.uid);
    const updatedStories = [...userProfile.customStories, story];
    await setDoc(docRef, { customStories: updatedStories }, { merge: true });
  };

  const deleteCustomStoryFromCloud = async (storyId: string) => {
    if (!user || !userProfile) return;
    const docRef = doc(db, "users", user.uid);
    const updatedStories = userProfile.customStories.filter(s => s.id !== storyId);
    await setDoc(docRef, { customStories: updatedStories }, { merge: true });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
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
