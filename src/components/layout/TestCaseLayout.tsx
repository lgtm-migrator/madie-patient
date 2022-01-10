import React from "react";
import { Route, Routes } from "react-router-dom";
import TestCaseLanding from "../testCaseLanding/TestCaseLanding";
import CreateTestCase from "../createTestCase/CreateTestCase";

const TestCaseLayout = () => {
  return (
    <Routes>
      <Route path="/measure/:measureId/edit/patients">
        <Route index element={<TestCaseLanding />} />
        <Route path="create" element={<CreateTestCase />} />
      </Route>
    </Routes>
  );
};

export default TestCaseLayout;
