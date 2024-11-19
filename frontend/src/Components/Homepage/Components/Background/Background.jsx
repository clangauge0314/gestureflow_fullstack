import "./Background.css";
import video1 from "../../assets/video1.mp4";
import image1 from "../../assets/image1.png";
import image2 from "../../assets/image2.png";
import image3 from "../../assets/image3.png";

import Navbar from "../Navbar/Navbar";
import Hero from "../Hero/Hero";
import { useEffect } from "react";

const Background = ({
  heroData,
  heroCount,
  playStatus,
  setHeroCount,
  setPlayStatus,
}) => {
  useEffect(() => {
    setInterval(() => {
      setHeroCount((count) => {
        return count === 2 ? 0 : count + 1;
      });
    }, 8000);
  }, []);

  return (
    <>
      <Navbar />
      <Hero
        heroData={heroData}
        playStatus={playStatus}
        setPlayStatus={setPlayStatus}
        heroCount={heroCount}
        setHeroCount={setHeroCount}
      />
      {playStatus ? (
        <video className="background fade-in" autoPlay loop muted>
          <source src={video1} type="video/mp4" />
        </video>
      ) : heroCount === 0 ? (
        <img src={image1} className="background fade-in" alt="" />
      ) : heroCount === 1 ? (
        <img src={image2} className="background fade-in" alt="" />
      ) : (
        <img src={image3} className="background fade-in" alt="" />
      )}
    </>
  );
};

export default Background;
