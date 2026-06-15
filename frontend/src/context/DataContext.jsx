import { createContext, useState } from "react";

export const DataContext = createContext();

export const DataProvider = ({ children }) => {

  const [datasetPreview, setDatasetPreview] =
    useState(null);

  return (
    <DataContext.Provider
      value={{
        datasetPreview,
        setDatasetPreview
      }}
    >
      {children}
    </DataContext.Provider>
  );
};