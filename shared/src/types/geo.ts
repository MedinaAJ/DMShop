export interface Zone {
  id: number;
  name: string;
  active: boolean;
}

export interface Country {
  id: number;
  idZone: number;
  isoCode: string;
  name: string;
  active: boolean;
  containsStates: boolean;
}

export interface State {
  id: number;
  idCountry: number;
  isoCode: string;
  name: string;
  active: boolean;
}
