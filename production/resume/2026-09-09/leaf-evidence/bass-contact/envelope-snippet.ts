 // This measured bass touch keeps its original idle-envelope influence until its contact phase.
 const bassOriginalContacts:Record<string,{time:number;duration:number;contactZ:number|null;contactLift:number}> = {"p00322":{"time":71.178428,"duration":0.269968,"contactZ":null,"contactLift":0.0062824555694730895}};
 const boundEnvelope=(note:Note,at:number,amount:number)=>{
  const value=envelope(contactPose(note,at)),old=hand.side==='L'&&fi===1&&note.contactZ===.280&&note.contactLift===.002?bassOriginalContacts[note.id]:undefined;
  if(!old||note.time!==old.time||note.duration!==old.duration)return value;
  const reference={...note,contactLift:old.contactLift};
  if(old.contactZ===null)delete reference.contactZ;else reference.contactZ=old.contactZ;
  return mix(envelope(contactPose(reference,at)),value,amount);
 };
 if(previous)weight=Math.min(weight,boundEnvelope(previous,end,previous&&next&&gap<.50?1-smooth((time-end)/Math.max(.001,gap)):1-smooth((time-end)/.19)));
 if(next)weight=Math.min(weight,boundEnvelope(next,start,previous&&next&&gap<.50?smooth((time-end)/Math.max(.001,gap)):smooth(1-(start-time)/.27)));
