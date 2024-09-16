import { Injectable } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { FLAG_SEARCH_KEY } from 'upgrade_types';

export interface TableState<T> {
  tableData: T[];
  searchParams: { searchString: string; searchKey: FLAG_SEARCH_KEY };
  allSearchableProperties: string[];
}
@Injectable({
  providedIn: 'root',
})
export class CommonTableHelpersService {
  /**
   * Maps table state to a MatTableDataSource.
   * @param tableData - The data to use for the MatTableDataSource.
   * @param searchParams - The search parameters to use for setting the filter on the MatTableDataSource.
   * @param allSearchableProperties - All properties that can be searched when filtering.
   * @returns A MatTableDataSource with the provided data and filter.
   */
  public mapTableStateToDataSource = <T>({ tableData, searchParams, allSearchableProperties }: TableState<T>) => {
    const dataSource = new MatTableDataSource(tableData);

    const updatedSearchableProperties = allSearchableProperties.map((property) =>
      property === 'tag' ? 'tags' : property
    );
    dataSource.filterPredicate = (rowData, filter) =>
      this.defineFilterFunctionCriteria(
        rowData,
        searchParams.searchKey,
        filter.toLowerCase(),
        updatedSearchableProperties
      );
    this.setFilterStringOnDataSource(dataSource, searchParams);
    return dataSource;
  };

  /**
   * Sets the filter for the provided MatTableDataSource based on the provided search parameters.
   * @param dataSource - The MatTableDataSource to set the filter on.
   * @param searchParams - The search parameters to use for setting the filter.
   */
  private setFilterStringOnDataSource<T>(
    dataSource: MatTableDataSource<T>,
    searchParams: { searchString: string; searchKey: string }
  ): void {
    if (typeof searchParams?.searchString === 'string') {
      dataSource.filter = searchParams.searchString;
    }
  }

  /**
   * Defines how filter string will be used to filter the row of data.
   * @param rowData - The row of data to define a filter predicate for.
   * @param propertyToFilterBy - The property to use for filtering the row of data.
   * @param filter - The filter string to use in the predicate.
   * @param allSearchableProperties - All properties that can be searched when filtering.
   * @returns A boolean indicating whether the row of data matches the filter.
   */
  private defineFilterFunctionCriteria<T>(
    rowData: T,
    propertyToFilterBy: string,
    filter: string,
    allSearchableProperties: string[]
  ) {
    if (propertyToFilterBy === 'all') {
      return this.filterAll<T>(rowData, allSearchableProperties, filter);
    } else if (propertyToFilterBy === 'tag') {
      return this.filterByProperty<T>(rowData, 'tags', filter);
    } else {
      return this.filterByProperty<T>(rowData, propertyToFilterBy, filter);
    }
  }

  /**
   * Filters a row of data based on a filter string and a set of keys.
   * @param rowData - The row of data to filter.
   * @param keys - The keys to use for filtering the row of data.
   * @param filter - The filter string to use for filtering the row of data.
   * @returns A boolean indicating whether the row of data matches the filter.
   */
  filterAll<T>(rowData: T, keys: string[], filter: string): boolean {
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
  filterByProperty<T>(rowData: T, propertyToFilterBy: string, filter: string): boolean {
    const propertyValue = rowData[propertyToFilterBy];
    if (Array.isArray(propertyValue)) {
      return propertyValue.some((value) => value.toLocaleLowerCase().includes(filter));
    } else if (typeof propertyValue === 'string') {
      return propertyValue.toLocaleLowerCase().includes(filter);
    }
    return false;
  }
}
