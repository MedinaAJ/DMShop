import { Table, Column, Model, DataType, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { Quote } from './quote.model.js';
import { Product } from './product.model.js';
import { ProductCombination } from './product-combination.model.js';

@Table({ tableName: 'dm_quote_items', timestamps: false, underscored: true })
export class QuoteItem extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Quote)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_quote' })
  declare id_quote: number;

  @BelongsTo(() => Quote, 'id_quote')
  declare quote: Quote;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_product' })
  declare id_product: number;

  @BelongsTo(() => Product, 'id_product')
  declare product: Product;

  @ForeignKey(() => ProductCombination)
  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_combination' })
  declare id_combination: number | null;

  @BelongsTo(() => ProductCombination, 'id_combination')
  declare combination: ProductCombination;

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  declare quantity: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false, field: 'unit_price' })
  declare unit_price: number;

  @Column({ type: DataType.DECIMAL(10, 2), allowNull: false })
  declare total: number;
}
