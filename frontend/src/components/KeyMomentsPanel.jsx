export default function KeyMomentsPanel({

    moments = [],

    onSeek = () => {}

}) {

    if (moments.length === 0) {

        return <p>No key moments.</p>;

    }

    return (

        <div>

            {moments.map((moment, index) => (

                <div
                    key={index}
                    className="moment-card"
                    style={{ cursor: "pointer" }}
                    onClick={() => {

    const [minutes, seconds] = moment.time.split(":").map(Number);

    const totalSeconds = minutes * 60 + seconds;

    onSeek(totalSeconds);

}}
                >

                    <h3>{moment.time}</h3>

                    <p>{moment.title}</p>

                </div>

            ))}

        </div>

    );

}