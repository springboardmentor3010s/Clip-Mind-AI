function LectureCard({

lecture,

onTranscript,

onSummary,

onTopics,

onQuiz,

onFlashcards,

onMaterial,

onShare

}){

return(

<div className="video-card">

<h2>

{lecture.title}

</h2>

<p>

{lecture.description}

</p>

<p>

Status :

{lecture.status}

</p>

<div className="lecture-actions">

<button

onClick={()=>onTranscript(lecture)}

>

Transcript

</button>

<button

onClick={()=>onSummary(lecture)}

>

Summary

</button>

<button

onClick={()=>onTopics(lecture)}

>

Topics

</button>

<button

onClick={()=>onQuiz(lecture)}

>

Quiz

</button>

<button

onClick={()=>onFlashcards(lecture)}

>

Flashcards

</button>

<button

onClick={() => onMaterial(lecture)}

>

Key Moments

</button>

<button

onClick={()=>onShare(lecture)}

>

Share

</button>

</div>

</div>

);

}

export default LectureCard;