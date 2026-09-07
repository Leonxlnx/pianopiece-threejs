import type { WristMotionData } from './wrist-motion';
export type Hand = 'L' | 'R';
export interface JointPoseKeyframe { at: number; lift: number; sweep: number; roll?: number; }
export interface JointPoseControl { jointPath?: JointPoseKeyframe[]; duration?: number; distalDuration?: number; liftDegrees?: number; sweepDegrees?: number; }
/** Explicitly enabled, finite release routes; legacy travel fields stay inert. */
export interface FingerReleaseWaypoint { enabled: true; height: number; x: number; z: number; liftEnd: number; landStart: number; roll: number; duration: number; }
export interface Note { releaseWaypoint?: FingerReleaseWaypoint; approachPose?: JointPoseControl; releasePose?: JointPoseControl; id: string; time: number; duration: number; midi: number; velocity: number; contactLift?: number; contactZ?: number; thumbOpposition?: number; hand: Hand; finger: number; role?:string; }
export interface Section { name: string; start: number; end: number; energy: number; }
export interface Score { title: string; bpm: number; duration: number; notes: Note[]; sections: Section[]; pedals: {time:number;value:number}[]; accents: {time:number;energy:number}[]; harmony?: {bar:number;time:number;duration:number;chord:string}[]; tempoMap?:{time:number;bpm:number}[]; wristMotion?:WristMotionData; }
export interface Telemetry { time:number; activeNotes:number[]; contacts:{hand:Hand;finger:number;midi:number;error:number}[]; fps:number; triangles:number; calls:number; shot:string; ready:boolean; }
