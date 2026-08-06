import { forwardRef } from "react";

const VideoPlayer = forwardRef(

(

{

src,

onTimeUpdate,

onLoadedMetadata

},

ref

)=>{

return(

<div className="video-wrapper">

<video

ref={ref}

controls

className="video-player"

onTimeUpdate={onTimeUpdate}

onLoadedMetadata={onLoadedMetadata}

>

<source

src={src}

type="video/mp4"

/>

</video>

</div>

);

}

);

export default VideoPlayer;