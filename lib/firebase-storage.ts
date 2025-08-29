import { collection, doc, getDocs, setDoc, query, orderBy } from "firebase/firestore"
import { db } from "./firebase"
import type { Beer, Worker, Shift, Casino, SoftDrink, RestockRecord } from "@/types"

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

export const saveWorker = async (casinoId: string, worker: Worker): Promise<void> => {
  const workerRef = doc(db, `casinos/${casinoId}/workers`, worker.id)
  await setDoc(workerRef, worker)
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

export const getSoftDrinks = async (casinoId: string): Promise<SoftDrink[]> => {
  const softDrinksRef = collection(db, `casinos/${casinoId}/softDrinks`)
  const snapshot = await getDocs(softDrinksRef)
  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
    lastRestockDate: doc.data().lastRestockDate.toDate(),
  })) as SoftDrink[]
}

export const saveSoftDrinks = async (casinoId: string, softDrinks: SoftDrink[]): Promise<void> => {
  for (const softDrink of softDrinks) {
    const softDrinkRef = doc(db, `casinos/${casinoId}/softDrinks`, softDrink.id)
    await setDoc(softDrinkRef, softDrink)
  }
}

export const getRestockRecords = async (casinoId: string): Promise<RestockRecord[]> => {
  const restockRef = collection(db, `casinos/${casinoId}/restockRecords`)
  const q = query(restockRef, orderBy("date", "desc"))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
    date: doc.data().date.toDate(),
  })) as RestockRecord[]
}

export const saveRestockRecord = async (casinoId: string, record: RestockRecord): Promise<void> => {
  const restockRef = doc(db, `casinos/${casinoId}/restockRecords`, record.id)
  await setDoc(restockRef, record)
}

export const loadBeers = async (casinoId: string): Promise<Beer[]> => {
  try {
    return await getBeers(casinoId)
  } catch (error) {
    console.error("Error loading beers:", error)
    return []
  }
}

export const loadWorkers = async (casinoId: string): Promise<Worker[]> => {
  try {
    return await getWorkers(casinoId)
  } catch (error) {
    console.error("Error loading workers:", error)
    return []
  }
}

export const loadShifts = async (casinoId: string): Promise<Shift[]> => {
  try {
    return await getShifts(casinoId)
  } catch (error) {
    console.error("Error loading shifts:", error)
    return []
  }
}

export const loadSoftDrinks = async (casinoId: string): Promise<SoftDrink[]> => {
  try {
    return await getSoftDrinks(casinoId)
  } catch (error) {
    console.error("Error loading soft drinks:", error)
    return []
  }
}

export const getCasinos = (): Casino[] => [
  { id: "spezia", name: "Spezia" },
  { id: "cali-gran-casino", name: "Cali Gran Casino" },
]
