// ALTER TABLE para añadir esta tabla en producción:
// CREATE TABLE stock_movements (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   id_product INT NOT NULL,
//   id_combination INT NULL,
//   movement_type ENUM('in','out','adjustment','order_reserved','order_cancelled') NOT NULL,
//   quantity INT NOT NULL,
//   stock_before INT NOT NULL,
//   stock_after INT NOT NULL,
//   id_order INT NULL,
//   reason VARCHAR(255) NULL,
//   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
//   FOREIGN KEY (id_product) REFERENCES products(id),
//   FOREIGN KEY (id_combination) REFERENCES product_combinations(id),
//   FOREIGN KEY (id_order) REFERENCES orders(id)
// );

import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
} from 'sequelize-typescript';
import { Product } from './product.model.js';
import { ProductCombination } from './product-combination.model.js';
import { Order } from './order.model.js';

export type StockMovementType = 'in' | 'out' | 'adjustment' | 'order_reserved' | 'order_cancelled';

@Table({ tableName: 'stock_movements', updatedAt: false })
export class StockMovement extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  declare id: number;

  @ForeignKey(() => Product)
  @Column({ type: DataType.INTEGER, allowNull: false, field: 'id_product' })
  declare id_product: number;

  @ForeignKey(() => ProductCombination)
  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_combination' })
  declare id_combination: number | null;

  @Column({
    type: DataType.ENUM('in', 'out', 'adjustment', 'order_reserved', 'order_cancelled'),
    allowNull: false,
    field: 'movement_type',
  })
  declare movement_type: StockMovementType;

  @Column({ type: DataType.INTEGER, allowNull: false })
  declare quantity: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'stock_before' })
  declare stock_before: number;

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'stock_after' })
  declare stock_after: number;

  @ForeignKey(() => Order)
  @Column({ type: DataType.INTEGER, allowNull: true, field: 'id_order' })
  declare id_order: number | null;

  @Column({ type: DataType.STRING(255), allowNull: true })
  declare reason: string | null;

  @BelongsTo(() => Product, 'id_product')
  declare product: Product;

  @BelongsTo(() => ProductCombination, 'id_combination')
  declare combination: ProductCombination | null;

  @BelongsTo(() => Order, 'id_order')
  declare order: Order | null;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare created_at: Date;
}
