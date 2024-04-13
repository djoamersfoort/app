import { atom } from "jotai"

export interface Slot {
    name: string
    pod: string
    description: string
    tutors: string[]

    available: number
    taken: number
    is_registered: boolean

}

export const slotsAtom = atom<Slot[]>([])
export async function getSlots(token: string) {
    const { slots }: { slots: Slot[] } = await fetch('https://aanmelden.djoamersfoort.nl/api/v1/slots', {
        headers: {
            authorization: `Bearer ${token}`
        }
    }).then(res => res.json())

    return slots
}
