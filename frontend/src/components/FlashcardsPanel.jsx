import { useState } from "react";

export default function FlashcardsPanel({
    flashcards = []
}) {

    const [open, setOpen] = useState(-1);

    if (flashcards.length === 0)
        return <p>No flashcards generated.</p>;

    return (

        <div className="flashcards-grid">

            {flashcards.map((card, index) => (

                <div

                    key={index}

                    className="flashcard"

                    onClick={() =>
                        setOpen(
                            open === index
                                ? -1
                                : index
                        )
                    }

                >

                    {open === index

                        ? card.back

                        : card.front}

                </div>

            ))}

        </div>

    );

}