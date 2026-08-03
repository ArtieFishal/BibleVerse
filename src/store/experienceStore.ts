import { create } from 'zustand'

export type ScriptureMoment = {
  id: string
  reference: string
  text: string
}

type ExperienceState = {
  started: boolean
  muted: boolean
  /** 0 = start of shore, 1 = end of walk */
  progress: number
  walking: boolean
  activeScripture: ScriptureMoment | null
  visitedWaypoints: string[]
  look: { x: number; y: number }
  mobileInput: { x: number; y: number }
  setStarted: (started: boolean) => void
  setMuted: (muted: boolean) => void
  setProgress: (progress: number) => void
  setWalking: (walking: boolean) => void
  setActiveScripture: (scripture: ScriptureMoment | null) => void
  markWaypointVisited: (id: string) => void
  setLook: (look: { x: number; y: number }) => void
  setMobileInput: (input: { x: number; y: number }) => void
}

export const useExperienceStore = create<ExperienceState>((set) => ({
  started: false,
  muted: false,
  progress: 0,
  walking: false,
  activeScripture: null,
  visitedWaypoints: [],
  look: { x: 0, y: 0 },
  mobileInput: { x: 0, y: 0 },
  setStarted: (started) => set({ started }),
  setMuted: (muted) => set({ muted }),
  setProgress: (progress) => set({ progress: Math.min(1, Math.max(0, progress)) }),
  setWalking: (walking) => set({ walking }),
  setActiveScripture: (activeScripture) => set({ activeScripture }),
  markWaypointVisited: (id) =>
    set((state) =>
      state.visitedWaypoints.includes(id)
        ? state
        : { visitedWaypoints: [...state.visitedWaypoints, id] },
    ),
  setLook: (look) => set({ look }),
  setMobileInput: (mobileInput) => set({ mobileInput }),
}))

/** Scripture beats along the cinematic path (progress 0–1). */
export const WAYPOINTS: Array<ScriptureMoment & { at: number }> = [
  {
    id: 'wp-nets',
    at: 0.22,
    reference: 'Matthew 4:19',
    text: 'Follow me, and I will make you fishers of men.',
  },
  {
    id: 'wp-peace',
    at: 0.52,
    reference: 'John 14:27',
    text: 'Peace I leave with you, my peace I give unto you.',
  },
  {
    id: 'wp-light',
    at: 0.82,
    reference: 'John 8:12',
    text: 'I am the light of the world: he that followeth me shall not walk in darkness.',
  },
]
