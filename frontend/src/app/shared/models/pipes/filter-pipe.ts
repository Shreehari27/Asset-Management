import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {

  transform(items: any[], searchText: string, keys: string[]): any[] {
    if (!items) return [];
    if (!searchText || !keys || keys.length === 0) return items;

    searchText = searchText.toLowerCase();

    return items.filter(item =>
      keys.some(key => {
        const value = item[key];
        return value && value.toString().toLowerCase().includes(searchText);
      })
    );
  }

}
