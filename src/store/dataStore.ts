import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sale, Book } from '../types';

class DataStore {
  private sales: Sale[] = [];
  private books: Book[] = [];

  constructor() {
    this.loadFromStorage();
  }

  // Sales methods
  async addSale(sale: Sale) {
    this.sales.push(sale);
    await this.saveToStorage();
    this.sendToGoogleSheets('sales', sale);
  }

  getSales(): Sale[] {
    return this.sales;
  }

  // Books methods
  async addBook(book: Book) {
    const existingBookIndex = this.books.findIndex(b => b.name === book.name);
    if (existingBookIndex !== -1) {
      this.books[existingBookIndex] = book;
    } else {
      this.books.push(book);
    }
    await this.saveToStorage();
    this.sendToGoogleSheets('books', book);
  }

  getBooks(): Book[] {
    return this.books;
  }

  async updateBookQuantity(bookName: string, soldQuantity: number) {
    const bookIndex = this.books.findIndex(b => b.name === bookName);
    if (bookIndex !== -1) {
      this.books[bookIndex].quantity = Math.max(0, this.books[bookIndex].quantity - soldQuantity);
      await this.saveToStorage();
    }
  }

  // AsyncStorage methods
  private async saveToStorage() {
    try {
      const data = JSON.stringify({
        sales: this.sales,
        books: this.books
      });
      await AsyncStorage.setItem('bookSalesData', data);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  private async loadFromStorage() {
    try {
      const data = await AsyncStorage.getItem('bookSalesData');
      if (data) {
        const parsed = JSON.parse(data);
        this.sales = parsed.sales || [];
        this.books = parsed.books || [];
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  // Google Sheets integration (placeholder)
  private async sendToGoogleSheets(type: 'sales' | 'books', data: Sale | Book) {
    try {
      console.log(`Sending ${type} data to Google Sheets:`, data);
      // Implement Google Sheets API integration here
      return true;
    } catch (error) {
      console.error('Error sending data to Google Sheets:', error);
      return false;
    }
  }

  // Report generation
  generateReport() {
    const totalProfit = this.sales.reduce((sum, sale) => sum + sale.profit, 0);
    const totalBooksSold = this.sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalBooksRemaining = this.books.reduce((sum, book) => sum + book.quantity, 0);
    const totalRevenue = this.sales.reduce((sum, sale) => sum + (sale.sellingPrice * sale.quantity), 0);
    const totalCost = this.sales.reduce((sum, sale) => sum + (sale.wholesalePrice * sale.quantity), 0);

    return {
      totalProfit,
      totalBooksSold,
      totalBooksRemaining,
      totalRevenue,
      totalCost
    };
  }
}

export const dataStore = new DataStore();