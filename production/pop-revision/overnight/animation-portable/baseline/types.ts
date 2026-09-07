import type { WristMotionData } from './wrist-motion';
export type Hand = 'L' | 'R';
export interface JointPoseControl { duration?: number; distalDuration?: number; liftDegrees?: number; sweepDegrees?: number; }
export interface Note { approachPose?: JointPoseControl; releasePose?: JointPoseControl; id: string; time: number; duration: number; midi: number; velocity: number; contactLift?: number; contactZ?: number; thumbOpposition?: number; hand: Hand; finger: number; role?:string; }
export interface Section { name: string; start: number; end: number; energy: number; }
export interface Score { title: string; bpm: number; duration: number; notes: Note[]; sections: Section[]; pedals: {time:number;value:number}[]; accents: {time:number;energy:number}[]; harmony?: {bar:number;time:number;duration:number;chord:string}[]; tempoMap?:{time:number;bpm:number}[]; wristMotion?:WristMotionData; }
export interface Telemetry { time:number; activeNotes:number[]; contacts:{hand:Hand;finger:number;midi:number;error:number}[]; fps:number; triangles:number; calls:number; shot:string; ready:boolean; }
