"use server";

import { db } from "@/lib/firebase/config";
import { collection, addDoc, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { ProjectIdea } from "./generate-ideas";

export interface SavedProject extends ProjectIdea {
  id: string;
  githubUrl: string;
  userId: string;
  createdAt: any;
}

export async function saveProject(idea: ProjectIdea, githubUrl: string, userId: string) {
  if (!db) throw new Error("Database not initialized");

  try {
    const docRef = await addDoc(collection(db, "projects"), {
      ...idea,
      githubUrl,
      userId,
      createdAt: Timestamp.now(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error saving project:", error);
    throw new Error("Failed to save project to history.");
  }
}

export async function getUserHistory(userId: string): Promise<SavedProject[]> {
  if (!db) throw new Error("Database not initialized");

  try {
    const q = query(
      collection(db, "projects"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SavedProject[];
  } catch (error) {
    console.error("Error getting history:", error);
    throw new Error("Failed to fetch project history.");
  }
}
