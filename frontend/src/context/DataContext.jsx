import { useState } from "react";
import { DataContext } from "./ReactContexts";

export const DataProvider = ({ children }) => {
  const [datasetPreview, setDatasetPreview] = useState(null);

  return (
    <DataContext.Provider
      value={{
        datasetPreview,
        setDatasetPreview,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export { DataContext };



