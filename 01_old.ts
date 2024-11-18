import { AVERAGE_DAYS_OF_MONTH } from "@constants";
import {
  Person,
  PersonContactTypeReferenceItemDescription,
  Proposition,
} from "some_lib";
import { getActiveContact } from "./getActiveContact";
import { round } from "lodash";
import { templateDoc } from "../types";

// todo 3
export const fillJsonCustomerData = (
  doc: templateDoc,
  customerDataJson: {
    page: string;
    items: {
      id: string;
      lines: { text: string }[];
    }[];
  }[],
  proposition: Proposition,
  person: Person,
): void => {
  try {
    const email = getActiveContact(
      person.contactDetails,
      PersonContactTypeReferenceItemDescription.Email,
    );

    const address = person.addresses?.find(address => address.active);

    const arrayFormPropositionName = proposition.propositionName?.split(" ");

    customerDataJson.forEach(page => {
      page.items.forEach(item => {
        if (!item.id || !("text" in item.lines?.[0] ?? {})) {
          return;
        }
        customerDataJson.forEach(page => {
          page.items.forEach(item => {
            if (!item.id || !("text" in item.lines?.[0] ?? {})) {
              return;
            }

            switch (item.id) {
              case "ProductName":
                item.lines[0].text = proposition.propositionName ?? " ";
                break;
              case "FullName":
              case "SelfName":
                item.lines[0].text = person.fullName ?? " ";
                break;
              case "FirstName":
                item.lines[0].text = person.firstName ?? " ";
                break;
              case "Surname":
                item.lines[0].text = person.surname ?? " ";
                break;
              case "Address":
                item.lines[0].text = address?.line1 ?? " ";
                if (item.lines[1]?.text) {
                  item.lines[1].text = address?.line2 ?? " ";
                }
                if (item?.lines[2]?.text) {
                  item.lines[2].text = address?.town ?? " ";
                }
                if (item?.lines[3]?.text) {
                  item.lines[3].text = address?.postcode ?? " ";
                }
                break;
              case "Email":
                item.lines[0].text = email ?? " ";
                break;
              case "Line1":
                item.lines[0].text = address?.line1 ?? " ";
                break;
              case "Line2":
                item.lines[0].text = address?.line2 ?? " ";
                break;
              case "City":
                item.lines[0].text = address?.town ?? " ";
                break;
              case "Postcode":
                item.lines[0].text = address?.postcode ?? " ";
                break;
              case "VehicleDescription":
              case "DescriptionOfTuitionVehicle":
                item.lines[0].text =
                  arrayFormPropositionName?.slice(2, -2)?.join(" ") ?? " ";
                break;
              case "CurrentAABSMFranchise":
              case "Duration of hire":
                item.lines[0].text =
                  arrayFormPropositionName?.[1] === "Trainee"
                    ? `if You have a ${proposition.brand?.itemDescription} Trainee Franchise, the Provisional Period and then`
                    : " ";
                break;
              case "HireDuration":
              case "TermOf":
                item.lines[0].text = proposition.franTermDays
                  ? round(
                      proposition.franTermDays / AVERAGE_DAYS_OF_MONTH,
                      0,
                    ).toString()
                  : " ";
                break;
              case "FirstWeeklyFranchiseFee":
              case "WeeklyFranchiseFee":
              case "FirstWeeklyFranchiseFeeAmount":
              case "tWeeklyFranchiseFeeAmount":
                item.lines[0].text = proposition.priceExVat?.toString() ?? " ";
                break;
              case "FirstWeeklyFranchiseFeeVAT":
              case "WeeklyFranchiseFeeVAT":
              case "FirstWeeklyFranchiseFeeVat":
              case "tWeeklyFranchiseFeeVat":
                item.lines[0].text =
                  proposition.priceExVat && proposition.franAdminVat?.vat
                    ? (
                        proposition.franAdminVat.vat * proposition.priceExVat
                      ).toFixed(2)
                    : " ";
                break;
              case "FirstWeeklyFranchiseFeeTotal":
              case "WeeklyFranchiseFeeTotal":
                item.lines[0].text =
                  proposition.priceExVat && proposition.franAdminVat?.vat
                    ? (
                        proposition.priceExVat +
                        proposition.franAdminVat.vat * proposition.priceExVat
                      ).toFixed(2)
                    : " ";
                break;
            }
          });
        });
      });
    });
  } catch (err) {
    throw new Error(
      `Error filling json customer data for document revision ${doc.documentRevisionKey}: ${err}`,
    );
  }
};
