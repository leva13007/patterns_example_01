import { AVERAGE_DAYS_OF_MONTH } from "@constants";
import {
  Address,
  Person,
  PersonContactTypeReferenceItemDescription,
  Proposition,
} from "some_lib";
import { getActiveContact } from "./getActiveContact";
import { round } from "lodash";

export const defaultToSafeStringFactory = (
  str?: string | undefined | null,
): string => str ?? " ";

class CustomerDataStrategy {
  private address: Address | undefined;
  constructor(
    private proposition: Proposition,
    private person: Person,
    private useOldLogic: boolean,
  ) {
    const address = person.addresses?.find(address => address.active);
    this.address = address;
  }
  productName() {
    return [defaultToSafeStringFactory(this.proposition.propositionName)];
  }
  FullName() {
    return [defaultToSafeStringFactory(this.person.fullName)];
  }
  FirstName() {
    return [defaultToSafeStringFactory(this.person.firstName)];
  }
  Surname() {
    return [defaultToSafeStringFactory(this.person.surname)];
  }
  Address() {
    return [
      defaultToSafeStringFactory(this.address?.line1),
      defaultToSafeStringFactory(this.address?.line2),
      defaultToSafeStringFactory(this.address?.town),
      defaultToSafeStringFactory(this.address?.postcode),
    ];
  }
  Email() {
    return [
      defaultToSafeStringFactory(
        getActiveContact(
          this.person.contactDetails,
          PersonContactTypeReferenceItemDescription.Email,
        ),
      ),
    ];
  }
  Line1() {
    return [defaultToSafeStringFactory(this.address?.line1)];
  }
  Line2() {
    return [defaultToSafeStringFactory(this.address?.line2)];
  }
  City() {
    return [defaultToSafeStringFactory(this.address?.town)];
  }
  Postcode() {
    return [defaultToSafeStringFactory(this.address?.postcode)];
  }
  VehicleDescription() {
    return [
      defaultToSafeStringFactory(
        this.proposition.propositionName?.split(" ")?.slice(2, -2)?.join(" "),
      ),
    ];
  }
  CurrentAABSMFranchise() {
    return [
      this.proposition.propositionName?.split(" ")?.[1] === "Trainee" &&
      this.proposition.brand?.itemDescription
        ? `if You have a ${this.proposition.brand?.itemDescription} Trainee Franchise, the Provisional Period and then`
        : defaultToSafeStringFactory(),
    ];
  }
  TermOf() {
    return [
      this.proposition.franTermDays
        ? round(
            this.proposition.franTermDays / AVERAGE_DAYS_OF_MONTH,
            0,
          ).toString()
        : defaultToSafeStringFactory(),
    ];
  }
  WeeklyFranchiseFee() {
    return [
      defaultToSafeStringFactory(this.proposition.priceExVat?.toString()),
    ];
  }
  FranchiseFeeVAT() {
    return [
      this.proposition.priceExVat && this.proposition.franAdminVat?.vat
        ? (
            this.proposition.franAdminVat.vat * this.proposition.priceExVat
          ).toFixed(2)
        : defaultToSafeStringFactory(),
    ];
  }
  WeeklyFranchiseFeeTotal() {
    return [
      this.proposition.priceExVat && this.proposition.franAdminVat?.vat
        ? (
            this.proposition.priceExVat +
            this.proposition.franAdminVat.vat * this.proposition.priceExVat
          ).toFixed(2)
        : defaultToSafeStringFactory(),
    ];
  }

  private map = new Map<string, () => string[]>([
    ["ProductName", this.productName],
    ["FullName", this.FullName],
    ["SelfName", this.FullName],
    ["FirstName", this.FirstName],
    ["Surname", this.Surname],
    ["Address", this.Address],
    ["Email", this.Email],
    ["Line1", this.Line1],
    ["Line2", this.Line2],
    ["City", this.City],
    ["Postcode", this.Postcode],
    ["VehicleDescription", this.VehicleDescription],
    ["DescriptionOfTuitionVehicle", this.VehicleDescription],
    ["CurrentAABSMFranchise", this.CurrentAABSMFranchise],
    ["Duration of hire", this.CurrentAABSMFranchise],
    ["HireDuration", this.TermOf],
    ["TermOf", this.TermOf],
    ["FirstWeeklyFranchiseFee", this.WeeklyFranchiseFee],
    ["WeeklyFranchiseFee", this.WeeklyFranchiseFee],
    ["FirstWeeklyFranchiseFeeAmount", this.WeeklyFranchiseFee],
    ["tWeeklyFranchiseFeeAmount", this.WeeklyFranchiseFee],
    ["FirstWeeklyFranchiseFeeVAT", this.FranchiseFeeVAT],
    ["WeeklyFranchiseFeeVAT", this.FranchiseFeeVAT],
    ["FirstWeeklyFranchiseFeeVat", this.FranchiseFeeVAT],
    ["tWeeklyFranchiseFeeVat", this.FranchiseFeeVAT],
    ["FirstWeeklyFranchiseFeeTotal", this.WeeklyFranchiseFeeTotal],
    ["WeeklyFranchiseFeeTotal", this.WeeklyFranchiseFeeTotal],
  ]);
  process(id: string): string[] {
    const factory = this.map.get(id)?.bind(this);
    if (!factory) {
      return [];
    }
    return factory();
  }
}

type Item = {
  id: string;
  lines: { text: string; coords: { x: number; y: number } }[];
};

type JSONData = {
  page: string;
  items: Item[];
}[];

export const processCustomerData = (
  customerDataJson: JSONData,
  proposition: Proposition,
  person: Person,
  useOldLogic = true, // todo_release: remove after release Fleet feature on prod
): JSONData => {
  const strategy = new CustomerDataStrategy(proposition, person, useOldLogic);
  customerDataJson.forEach(page => {
    page.items.forEach(item => {
      const textines = strategy.process(item.id);
      item.lines = item.lines.map((line, index) => ({
        coords: line.coords,
        text: textines[index],
      }));
    });
  });

  return customerDataJson;
};

// customerDataJson
// [
//   {
//     page: 4,
//     items: [
//       {
//         id: 'ProductName',
//         lines: [
//           {
//             coords: { x: 77, y: 235 },
//             text: 'CCC 24m Full B Automatic [2024.09] 24m'
//           }
//         ]
//       },
//       {
//         id: 'FirstName',
//         lines: [ { coords: { x: 363, y: 563 }, text: 'White' } ]
//       },
//       {
//         id: 'Surname',
//         lines: [ { coords: { x: 363, y: 579 }, text: 'Vasquez' } ]
//       },
//       {
//         id: 'Address',
//         breakLineAfter: 50,
//         lines: [
//           { coords: { x: 363, y: 595 }, text: '00 Uplands Avenue' },
//           { coords: { x: 363, y: 611 }, text: '' },
//           { coords: { x: 363, y: 627 }, text: 'STOCKPORT' },
//           { coords: { x: 363, y: 643 }, text: 'SK04 0ZZ' }
//         ]
//       },
//       {
//         id: 'Email',
//         lines: [
//           { coords: { x: 363, y: 658 }, text: 'test@test.com' }
//         ]
//       }
//     ]
//   },
//   {
//     page: 7,
//     items: [
//       {
//         id: 'SelfName',
//         lines: [ { coords: { x: 41, y: 176 }, text: 'Mrs White Vasquez' } ]
//       },
//       {
//         id: 'Line1',
//         lines: [ { coords: { x: 40, y: 192 }, text: '00 Uplands Avenue' } ]
//       },
//       {
//         id: 'Line2',
//         lines: [ { coords: { x: 40, y: 208 }, text: '' } ]
//       },
//       {
//         id: 'City',
//         lines: [ { coords: { x: 40, y: 224 }, text: 'STOCKPORT' } ]
//       },
//       {
//         id: 'Postcode',
//         lines: [ { coords: { x: 40, y: 240 }, text: 'SK00 0ZZ' } ]
//       },
//       {
//         id: 'VehicleDescription',
//         lines: [ { coords: { x: 42, y: 297 }, text: 'Full B Automatic' } ]
//       },
//       {
//         id: 'CurrentAABSMFranchise',
//         lines: [ { coords: { x: 42, y: 344 }, text: ' ' } ]
//       },
//       {
//         id: 'HireDuration',
//         lines: [ { coords: { x: 135, y: 359 }, text: '24' } ]
//       },
//       {
//         id: 'FirstWeeklyFranchiseFee',
//         lines: [ { coords: { x: 382, y: 494 }, text: '182.5' } ]
//       },
//       {
//         id: 'FirstWeeklyFranchiseFeeVAT',
//         lines: [ { coords: { x: 441, y: 494 }, text: '36.50' } ]
//       },
//       {
//         id: 'FirstWeeklyFranchiseFeeTotal',
//         lines: [ { coords: { x: 502, y: 494 }, text: '219.00' } ]
//       },
//       {
//         id: 'WeeklyFranchiseFee',
//         lines: [ { coords: { x: 382, y: 527 }, text: '182.5' } ]
//       },
//       {
//         id: 'WeeklyFranchiseFeeVAT',
//         lines: [ { coords: { x: 442, y: 527 }, text: '36.50' } ]
//       },
//       {
//         id: 'WeeklyFranchiseFeeTotal',
//         lines: [ { coords: { x: 502, y: 527 }, text: '219.00' } ]
//       }
//     ]
//   }
// ]

// customerDataJson
// [
//   {
//     page: 1,
//     items: [
//       {
//         id: 'SelfName',
//         lines: [ { coords: { x: 40, y: 190 }, text: 'Mrs White Vasquez' } ]
//       },
//       {
//         id: 'Line1',
//         lines: [ { coords: { x: 40, y: 206 }, text: '00 Uplands Avenue' } ]
//       },
//       {
//         id: 'Line2',
//         lines: [ { coords: { x: 40, y: 222 }, text: '' } ]
//       },
//       {
//         id: 'City',
//         lines: [ { coords: { x: 40, y: 238 }, text: 'STOCKPORT' } ]
//       },
//       {
//         id: 'Postcode',
//         lines: [ { coords: { x: 40, y: 254 }, text: 'SK00 0ZZ' } ]
//       },
//       {
//         id: 'DescriptionOfTuitionVehicle',
//         lines: [ { coords: { x: 40, y: 309 }, text: 'Full B Automatic' } ]
//       },
//       {
//         id: 'Duration of hire',
//         lines: [ { coords: { x: 40, y: 358 }, text: ' ' } ]
//       },
//       {
//         id: 'TermOf',
//         lines: [ { coords: { x: 135, y: 374 }, text: '24' } ]
//       },
//       {
//         id: 'FirstWeeklyFranchiseFeeAmount',
//         lines: [ { coords: { x: 383, y: 506 }, text: '182.5' } ]
//       },
//       {
//         id: 'FirstWeeklyFranchiseFeeVat',
//         lines: [ { coords: { x: 440, y: 506 }, text: '36.50' } ]
//       },
//       {
//         id: 'FirstWeeklyFranchiseFeeTotal',
//         lines: [ { coords: { x: 502, y: 506 }, text: '219.00' } ]
//       },
//       {
//         id: 'tWeeklyFranchiseFeeAmount',
//         lines: [ { coords: { x: 383, y: 539 }, text: '182.5' } ]
//       },
//       {
//         id: 'tWeeklyFranchiseFeeVat',
//         lines: [ { coords: { x: 440, y: 539 }, text: '36.50' } ]
//       },
//       {
//         id: 'WeeklyFranchiseFeeTotal',
//         lines: [ { coords: { x: 502, y: 539 }, text: '219.00' } ]
//       }
//     ]
//   }
// ]

// ----------------------------------------------------------------------------------------------------------------------------

// customerDataJson
// [
//   {
//     page: 4,
//     items: [
//       {
//         id: 'ProductName',
//         lines: [ { coords: { x: 77, y: 235 }, text: 'Product Name here' } ]
//       },
//       {
//         id: 'FirstName',
//         lines: [ { coords: { x: 363, y: 563 }, text: 'The First Name' } ]
//       },
//       {
//         id: 'Surname',
//         lines: [ { coords: { x: 363, y: 579 }, text: 'The Surname' } ]
//       },
//       {
//         id: 'Address',
//         breakLineAfter: 50,
//         lines: [
//           { coords: { x: 363, y: 595 }, text: 'Address line 1' },
//           { coords: { x: 363, y: 611 }, text: 'Address line 2' },
//           { coords: { x: 363, y: 627 }, text: 'Address town' },
//           { coords: { x: 363, y: 643 }, text: 'Address postcode' }
//         ]
//       },
//       {
//         id: 'Email',
//         lines: [ { coords: { x: 363, y: 658 }, text: 'test@test.com' } ]
//       }
//     ]
//   },
//   {
//     page: 7,
//     items: [
//       {
//         id: 'SelfName',
//         lines: [ { coords: { x: 41, y: 176 }, text: 'My details' } ]
//       },
//       {
//         id: 'Line1',
//         lines: [ { coords: { x: 40, y: 192 }, text: 'My address - line 1' } ]
//       },
//       {
//         id: 'Line2',
//         lines: [ { coords: { x: 40, y: 208 }, text: 'My address - line 2' } ]
//       },
//       {
//         id: 'City',
//         lines: [ { coords: { x: 40, y: 224 }, text: 'My city' } ]
//       },
//       {
//         id: 'Postcode',
//         lines: [ { coords: { x: 40, y: 240 }, text: 'My postcode' } ]
//       },
//       {
//         id: 'VehicleDescription',
//         lines: [ { coords: { x: 42, y: 297 }, text: 'The Vehicle details' } ]
//       },
//       {
//         id: 'CurrentAABSMFranchise',
//         lines: [
//           {
//             coords: { x: 42, y: 344 },
//             text: 'Current AA or BSM Franchise if exists'
//           }
//         ]
//       },
//       {
//         id: 'HireDuration',
//         lines: [ { coords: { x: 135, y: 359 }, text: '12' } ]
//       },
//       {
//         id: 'FirstWeeklyFranchiseFee',
//         lines: [ { coords: { x: 382, y: 494 }, text: '1000' } ]
//       },
//       {
//         id: 'FirstWeeklyFranchiseFeeVAT',
//         lines: [ { coords: { x: 441, y: 494 }, text: '10' } ]
//       },
//       {
//         id: 'FirstWeeklyFranchiseFeeTotal',
//         lines: [ { coords: { x: 502, y: 494 }, text: '1010' } ]
//       },
//       {
//         id: 'WeeklyFranchiseFee',
//         lines: [ { coords: { x: 382, y: 527 }, text: '2000' } ]
//       },
//       {
//         id: 'WeeklyFranchiseFeeVAT',
//         lines: [ { coords: { x: 442, y: 527 }, text: '20' } ]
//       },
//       {
//         id: 'WeeklyFranchiseFeeTotal',
//         lines: [ { coords: { x: 502, y: 527 }, text: '2020' } ]
//       }
//     ]
//   }
// ]

// customerDataJson
// [
//   {
//     page: 1,
//     items: [
//       {
//         id: 'SelfName',
//         lines: [ { coords: { x: 40, y: 190 }, text: 'My details' } ]
//       },
//       {
//         id: 'Line1',
//         lines: [ { coords: { x: 40, y: 206 }, text: 'My address - line 1' } ]
//       },
//       {
//         id: 'Line2',
//         lines: [ { coords: { x: 40, y: 222 }, text: 'My address - line 2' } ]
//       },
//       {
//         id: 'City',
//         lines: [ { coords: { x: 40, y: 238 }, text: 'My city' } ]
//       },
//       {
//         id: 'Postcode',
//         lines: [ { coords: { x: 40, y: 254 }, text: 'My postcode' } ]
//       },
//       {
//         id: 'DescriptionOfTuitionVehicle',
//         lines: [
//           {
//             coords: { x: 40, y: 309 },
//             text: 'The description of my tuition vehicle'
//           }
//         ]
//       },
//       {
//         id: 'Duration of hire',
//         lines: [ { coords: { x: 40, y: 358 }, text: 'The duration of hire' } ]
//       },
//       {
//         id: 'TermOf',
//         lines: [ { coords: { x: 135, y: 374 }, text: '12' } ]
//       },
//       {
//         id: 'FirstWeeklyFranchiseFeeAmount',
//         lines: [ { coords: { x: 383, y: 506 }, text: '45.00' } ]
//       },
//       {
//         id: 'FirstWeeklyFranchiseFeeVat',
//         lines: [ { coords: { x: 440, y: 506 }, text: '125.00' } ]
//       },
//       {
//         id: 'FirstWeeklyFranchiseFeeTotal',
//         lines: [ { coords: { x: 502, y: 506 }, text: '12' } ]
//       },
//       {
//         id: 'tWeeklyFranchiseFeeAmount',
//         lines: [ { coords: { x: 383, y: 539 }, text: '40.00' } ]
//       },
//       {
//         id: 'tWeeklyFranchiseFeeVat',
//         lines: [ { coords: { x: 440, y: 539 }, text: '130.00' } ]
//       },
//       {
//         id: 'WeeklyFranchiseFeeTotal',
//         lines: [ { coords: { x: 502, y: 539 }, text: '170.00' } ]
//       }
//     ]
//   }
// ]
