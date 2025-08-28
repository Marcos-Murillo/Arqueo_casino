import { collection, doc, getDocs, setDoc, query, orderBy } from "firebase/firestore"
import { db } from "./firebase"
import type { Beer, Worker, Shift, Casino } from "@/types"

export const getBeers = async (casinoId: string): Promise<Beer[]> => {
  const beersRef = collection(db, `casinos/${casinoId}/beers`)
  const snapshot = await getDocs(beersRef)
  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
    lastRestockDate: doc.data().lastRestockDate.toDate(),
  })) as Beer[]
}

export const saveBeers = async (casinoId: string, beers: Beer[]): Promise<void> => {
  for (const beer of beers) {
    const beerRef = doc(db, `casinos/${casinoId}/beers`, beer.id)
    await setDoc(beerRef, beer)
  }
}

export const getWorkers = async (casinoId: string): Promise<Worker[]> => {
  const workersRef = collection(db, `casinos/${casinoId}/workers`)
  const snapshot = await getDocs(workersRef)
  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt.toDate(),
  })) as Worker[]
}

export const saveWorkers = async (casinoId: string, workers: Worker[]): Promise<void> => {
  for (const worker of workers) {
    const workerRef = doc(db, `casinos/${casinoId}/workers`, worker.id)
    await setDoc(workerRef, worker)
  }
}

export const getShifts = async (casinoId: string): Promise<Shift[]> => {
  const shiftsRef = collection(db, `casinos/${casinoId}/shifts`)
  const q = query(shiftsRef, orderBy("startTime", "desc"))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
    startTime: doc.data().startTime.toDate(),
    endTime: doc.data().endTime?.toDate(),
  })) as Shift[]
}

export const saveShifts = async (casinoId: string, shifts: Shift[]): Promise<void> => {
  for (const shift of shifts) {
    const shiftRef = doc(db, `casinos/${casinoId}/shifts`, shift.id)
    await setDoc(shiftRef, shift)
  }
}

export const getCasinos = (): Casino[] => [
  { id: "spezia", name: "Spezia" },
  { id: "cali-gran-casino", name: "Cali Gran Casino" },
]
