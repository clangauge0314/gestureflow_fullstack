import React from "react";
import ContentHeader from "./ContentHeader";
import Card from "./Card";
import RecentPresentations from "./RecentPresentations";
import "./Content.css"

const Content = () => {
  return <div className="content">
    <ContentHeader />
    <Card />
    <RecentPresentations />
  </div>;
};

export default Content;
