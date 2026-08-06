export default function TopicsPanel({ topics = [] }) {

    if (topics.length === 0)
        return <p>No topics generated.</p>;

    return (

        <div className="topics-grid">

            {topics.map((topic, index) => (

                <div
                    key={index}
                    className="topic-card"
                >

                    {topic}

                </div>

            ))}

        </div>

    );

}