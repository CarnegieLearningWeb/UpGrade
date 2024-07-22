import { Injectable } from '@angular/core';

/**
 * A service class that provides common text formatting helpers.
 *
 * This class contains static methods to format group types, convert names to keys, etc.
 * The methods are static so they can be used in pure functions like selectors without
 * needing to create an instance of the service.
 */
@Injectable()
export class CommonTextHelpersService {
  /**
   * Formats an array of group types into an array of objects with value and viewValue properties.
   *
   * @param groupTypes - An array of group type strings, as defined in context-metadata.
   * @returns An array of objects where each object contains a value and a viewValue property, or [] if groupTypes is falsy.
   *
   * The method is static so it can be used in pure functions like selectors without needing
   * to create an instance of the service.
   */
  public static formatGroupTypes(groupTypes: string[]): { value: string; viewValue: string }[] {
    if (!Array.isArray(groupTypes)) {
      return [];
    }
    return groupTypes.map((groupType) => {
      return { value: groupType, viewValue: CommonTextHelpersService.formatGroupTypeViewValue(groupType) };
    });
  }

  /**
   * Formats a group type string into a view value string.
   *
   * @param groupType - A group type string.
   * @returns A formatted view value string.
   *
   * The method is static so it can be used in pure functions like selectors without needing
   * to create an instance of the service.
   */
  public static formatGroupTypeViewValue(groupType: string): string {
    return 'Group: "' + groupType + '"';
  }

  /**
   * Converts a name string into a feature-flag permitted key format by trimming, converting to uppercase, and replacing spaces with underscores.
   *
   * @param str - A string to be formatted.
   * @returns A key string.
   *
   * The method is static so it can be used in pure functions like selectors without needing
   * to create an instance of the service.
   */
  public static convertStringToFeatureFlagKeyFormat(str: string): string {
    const upperCaseString = str.trim().toUpperCase();
    const key = upperCaseString.replace(/ /g, '_');
    return key;
  }
}
