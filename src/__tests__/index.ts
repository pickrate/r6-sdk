import {
  Siege,
  SearchPlatform,
  Platform,
  Mode,
  Region,
  Statistic,
  allStats,
} from "../index";

// ensures the API doesn't change accidentally
describe("Rainbow Six Siege SDK", () => {
  it("exports Siege", () => {
    expect(Siege).toBeTruthy();
  });
  it("exports SearchPlatform", () => {
    expect(SearchPlatform).toBeTruthy();
  });
  it("exports Platform", () => {
    expect(Platform).toBeTruthy();
  });
  it("exports Mode", () => {
    expect(Mode).toBeTruthy();
  });
  it("exports Region", () => {
    expect(Region).toBeTruthy();
  });
  it("exports Statistic", () => {
    expect(Statistic).toBeTruthy();
  });
  it("exports allStats", () => {
    expect(allStats).toBeTruthy();
  });
});
