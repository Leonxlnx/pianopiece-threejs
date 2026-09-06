"""4x4 repro of tracked deleted FBO restoration; no scene or native frame render."""
from pathlib import Path
import moderngl,json
rows=[]
for bind_stable in [False,True]:
 c=moderngl.create_standalone_context(backend='egl',require=330,libegl='/workspace/scratch/2e8cc8e77f98/render-libs/root/usr/lib/x86_64-linux-gnu/libEGL.so.1',libgl='libGL.so.1')
 stable=c.framebuffer([c.texture((4,4),4)]);a=c.framebuffer([c.texture((4,4),4)]);b=c.framebuffer([c.texture((4,4),4)]);ids=[stable.glo,a.glo,b.glo];b.use()
 if bind_stable:stable.use()
 a.release();b.release();afterRelease=c.error;new=c.framebuffer(depth_attachment=c.depth_texture((4,4)));afterNew=c.error;rows.append({'bindStableBeforeRelease':bind_stable,'originalIds':ids,'newId':new.glo,'afterRelease':afterRelease,'afterNewFramebuffer':afterNew});c.release()
assert rows[0]['afterNewFramebuffer']=='GL_INVALID_OPERATION' and rows[1]['afterNewFramebuffer']=='GL_NO_ERROR'
Path(__file__).with_name('released-framebuffer-repro.json').write_text(json.dumps(rows,indent=2));print(json.dumps(rows))
