import { Injectable } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

@Injectable({
  providedIn: 'root',
})
export class CommonTableHelpersService {
  /**
   * Sets a filter predicate function based on a provided search key and a record of filter functions.
   * The search key is used to select the appropriate filter function from the record.
   * If a matching filter function is found, it is used to filter the row data.
   * If no matching filter function is found, the predicate returns false.
   *
   * @param searchKey - The key to use for selecting a filter function from the record.
   * @param filterFunctions - A record of filter functions, keyed by search key.
   * @returns A filter predicate function that takes a row of data and a filter string and returns a boolean.
   */
  setFilterPredicate(
    searchKey: string,
    filterFunctions: Record<string, (rowData: any, filter: string) => boolean>
  ): (rowData: any, filter: string) => boolean {
    return (rowData, filter: string): boolean => {
      const filterFunction = filterFunctions[searchKey];
      return filterFunction ? filterFunction(rowData, filter) : false;
    };
  }

  /**
   * Sets the filter for the provided MatTableDataSource based on the provided search parameters.
   * @param dataSource - The MatTableDataSource to set the filter on.
   * @param searchParams - The search parameters to use for setting the filter.
   */
  setDataSourceFilter<T>(
    dataSource: MatTableDataSource<T>,
    searchParams: { searchString?: string; searchKey?: string }
  ): void {
    if (typeof searchParams?.searchString === 'string') {
      dataSource.filter = searchParams.searchString;
    }
  }

  /**
   * Defines a filter predicate for a row of data.
   * @param rowData - The row of data to define a filter predicate for.
   * @param filter - The filter string to use in the predicate.
   * @returns A boolean indicating whether the row of data matches the filter.
   */
  defineFilterPredicate<T>(rowData: T, filter: string) {
    const allFilterableKeys = Object.keys(rowData) as (keyof T)[];
    return this.filterAll(rowData, allFilterableKeys, filter);
  }

  /**
   * Maps table state to a MatTableDataSource.
   * @param tableData - The data to use for the MatTableDataSource.
   * @param searchParams - The search parameters to use for setting the filter on the MatTableDataSource.
   * @returns A MatTableDataSource with the provided data and filter.
   */
  mapTableStateToDataSource = <T>({ tableData, searchParams }: { tableData: T[]; searchParams: any }) => {
    const dataSource = new MatTableDataSource(tableData);
    dataSource.filterPredicate = (rowData, filter) => this.defineFilterPredicate(rowData, filter);
    this.setDataSourceFilter(dataSource, searchParams);
    return dataSource;
  };

  /**
   * Filters a row of data based on a filter string and a set of keys.
   * @param rowData - The row of data to filter.
   * @param keys - The keys to use for filtering the row of data.
   * @param filter - The filter string to use for filtering the row of data.
   * @returns A boolean indicating whether the row of data matches the filter.
   */
  filterAll<T>(rowData: T, keys: (keyof T)[], filter: string): boolean {
    return keys.some((key) => this.filterByProperty(rowData, key, filter));
  }

  /**
   * Filters a row of data based on a specific property and a filter string.
   * If the property value is an array, it checks if any element in the array includes the filter string.
   * If the property value is a string, it checks if the string includes the filter string.
   * The comparison is case-insensitive.
   *
   * @param rowData - The row of data to filter.
   * @param propertyToFilterBy - The property to use for filtering the row of data.
   * @param filter - The filter string to use for filtering the row of data.
   * @returns A boolean indicating whether the row of data matches the filter.
   */
  filterByProperty<T>(rowData: T, propertyToFilterBy: keyof T, filter: string): boolean {
    const propertyValue = rowData[propertyToFilterBy];
    if (Array.isArray(propertyValue)) {
      return propertyValue.some((value) => value.toLocaleLowerCase().includes(filter));
    } else if (typeof propertyValue === 'string') {
      return propertyValue.toLocaleLowerCase().includes(filter);
    }
    return false;
  }
}
