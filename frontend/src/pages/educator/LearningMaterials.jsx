import { useState } from "react";

import DashboardLayout from "../../components/DashboardLayout";

import api from "../../api/axios";

function LearningMaterials(){

const [videoId,setVideoId]=useState("");

const [data,setData]=useState(null);

const generate=async()=>{

try{

const res=await api.get(

`/educator/materials/${videoId}`

);

setData(res.data);

}

catch(err){

console.log(err);

alert("Generation Failed");

}

};

return(

<DashboardLayout role="educator">

<h1>

Learning Materials

</h1>

<input

type="number"

placeholder="Video ID"

value={videoId}

onChange={(e)=>

setVideoId(e.target.value)

}

/>

<button

onClick={generate}

>

Generate

</button>

{

data&&(

<>

<h2>

Study Notes

</h2>

<div className="summary-box">

{data.notes}

</div>

<h2>

Assignment

</h2>

<ul>

{

data.assignment.map(

(item,index)=>(

<li key={index}>

{item}

</li>

)

)

}

</ul>

<h2>

Question Bank

</h2>

<ul>

{

data.question_bank.map(

(item,index)=>(

<li key={index}>

{item}

</li>

)

)

}

</ul>

<h2>

Revision Guide

</h2>

<ul>

{

data.revision_guide.map(

(item,index)=>(

<li key={index}>

{item}

</li>

)

)

}

</ul>

</>

)

}

</DashboardLayout>

);

}

export default LearningMaterials;