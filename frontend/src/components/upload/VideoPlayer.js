import ReactPlayer from "react-player";

export default function VideoPlayer(){

return(

<div className="card">

<h4>🎥 Video Analysis</h4>

<ReactPlayer

url="https://www.youtube.com/watch?v=ysz5S6PUM-U"

controls

width="100%"

height="420px"

/>

</div>

)

}