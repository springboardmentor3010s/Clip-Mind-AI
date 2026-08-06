function LectureModal({

title,

content,

onClose

}){

return(

<div className="modal-overlay">

<div className="modal">

<h2>

{title}

</h2>

<div
    style={{
        whiteSpace: "pre-wrap",
        maxHeight: "500px",
        overflowY: "auto"
    }}
>

{content}

</div>

<button

onClick={onClose}

>

Close

</button>

</div>

</div>

);

}

export default LectureModal;