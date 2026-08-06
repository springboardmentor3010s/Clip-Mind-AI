import { createContext, useState } from "react";

export const VideoContext = createContext();

export function VideoProvider({ children }) {

  const [selectedVideo, setSelectedVideo] = useState(null);

  return (

    <VideoContext.Provider
      value={{
        selectedVideo,
        setSelectedVideo
      }}
    >

      {children}

    </VideoContext.Provider>

  );

}