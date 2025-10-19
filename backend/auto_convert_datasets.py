#!/usr/bin/env python3
"""
Automated Dataset Conversion Utility
Automatically converts and assigns CSV files to stock symbols
"""
import os
import pandas as pd
from pathlib import Path

def clean_price_column(price_str):
    """Remove dollar signs and convert to float"""
    if isinstance(price_str, str):
        return float(price_str.replace('$', '').replace(',', ''))
    return float(price_str)

def guess_symbol_from_data(csv_file):
    """Try to guess stock symbol based on price patterns and data characteristics"""
    try:
        df = pd.read_csv(csv_file, nrows=100)  # Read first 100 rows for analysis
        
        # Find price column
        price_col = None
        for col in df.columns:
            if 'close' in col.lower() or 'last' in col.lower():
                price_col = col
                break
        
        if not price_col:
            return None, 0
        
        # Clean and analyze prices
        prices = df[price_col].apply(clean_price_column)
        avg_price = prices.mean()
        max_price = prices.max()
        min_price = prices.min()
        volatility = prices.std() / avg_price if avg_price > 0 else 0
        
        print(f"File: {csv_file.name}")
        print(f"  Price range: ${min_price:.2f} - ${max_price:.2f}")
        print(f"  Average: ${avg_price:.2f}")
        print(f"  Volatility: {volatility:.3f}")
        
        # Symbol assignment based on typical price ranges (approximate as of 2024-2025)
        if 400 <= avg_price <= 600:
            if volatility > 0.05:  # High volatility suggests NVDA
                return "NVDA", 0.9
            else:
                return "SPY", 0.7  # Could be SPY or another high-priced stock
                
        elif 300 <= avg_price < 400:
            return "MSFT", 0.8  # Microsoft typically in this range
            
        elif 200 <= avg_price < 300:
            if volatility > 0.04:  # Higher volatility might suggest TSLA
                return "TSLA", 0.8
            else:
                return "AAPL", 0.8  # Apple typically in this range
                
        elif 150 <= avg_price < 200:
            return "AMZN", 0.7  # Amazon after stock splits
            
        elif 100 <= avg_price < 150:
            if volatility > 0.03:
                return "META", 0.7  # Meta/Facebook
            else:
                return "GOOGL", 0.7  # Alphabet/Google
                
        elif 50 <= avg_price < 100:
            return "TSMC", 0.6  # Taiwan Semiconductor
            
        elif avg_price < 50:
            return "NFLX", 0.5  # Could be Netflix or another lower-priced stock
            
        else:
            return None, 0
            
    except Exception as e:
        print(f"Error analyzing {csv_file}: {e}")
        return None, 0

def convert_csv_file(input_file, output_file, symbol):
    """Convert a single CSV file to proper format"""
    try:
        # Read the CSV file
        df = pd.read_csv(input_file)
        
        # Map columns to standard format
        column_mapping = {}
        for col in df.columns:
            col_lower = col.lower()
            if 'date' in col_lower:
                column_mapping[col] = 'date'
            elif 'close' in col_lower or 'last' in col_lower:
                column_mapping[col] = 'close'
            elif 'open' in col_lower:
                column_mapping[col] = 'open'
            elif 'high' in col_lower:
                column_mapping[col] = 'high'
            elif 'low' in col_lower:
                column_mapping[col] = 'low'
            elif 'volume' in col_lower:
                column_mapping[col] = 'volume'
        
        # Rename columns
        df = df.rename(columns=column_mapping)
        
        # Ensure we have required columns
        required_columns = ['date', 'open', 'high', 'low', 'close', 'volume']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            print(f"  Adding missing columns: {missing_columns}")
            for col in missing_columns:
                if col in ['open', 'high', 'low']:
                    df[col] = df['close']  # Use close price as approximation
                elif col == 'volume':
                    df[col] = 1000000  # Default volume
        
        # Clean price columns (remove $ signs)
        price_columns = ['open', 'high', 'low', 'close']
        for col in price_columns:
            if col in df.columns:
                df[col] = df[col].apply(clean_price_column)
        
        # Clean volume column
        if 'volume' in df.columns:
            df['volume'] = df['volume'].astype(str).str.replace(',', '').astype(int)
        
        # Convert date to proper format
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')
        df['date'] = df['date'].dt.strftime('%Y-%m-%d')
        
        # Select and reorder columns
        df = df[required_columns]
        
        # Remove any rows with invalid data
        df = df.dropna()
        df = df[df['close'] > 0]
        
        # Save to output file
        df.to_csv(output_file, index=False)
        print(f"  ✅ Saved {df.shape[0]} rows to {output_file.name}")
        print(f"  📅 Date range: {df['date'].min()} to {df['date'].max()}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Error converting: {e}")
        return False

def main():
    """Main conversion process"""
    print("Automated Dataset Conversion")
    print("=" * 40)
    
    # Directories
    datasets_dir = Path("data/historical_datasets")
    
    if not datasets_dir.exists():
        print(f"❌ Directory {datasets_dir} not found")
        return
    
    # Get all CSV files (excluding ones that are already properly named)
    all_files = list(datasets_dir.glob("*.csv"))
    target_symbols = {"AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "META", "NVDA", "NFLX", "TSMC", "SPY"}
    
    # Filter out files that are already properly named
    csv_files = []
    existing_symbols = set()
    
    for file in all_files:
        symbol = file.stem.upper()
        if symbol in target_symbols:
            existing_symbols.add(symbol)
            print(f"✅ {symbol}.csv already exists")
        else:
            csv_files.append(file)
    
    remaining_symbols = target_symbols - existing_symbols
    print(f"\n📁 Found {len(csv_files)} files to convert")
    print(f"🎯 Need symbols: {', '.join(sorted(remaining_symbols))}")
    
    if not csv_files:
        print("No files to convert!")
        return
    
    # Analyze and assign files
    assignments = []
    
    for csv_file in csv_files:
        symbol, confidence = guess_symbol_from_data(csv_file)
        if symbol and symbol in remaining_symbols:
            assignments.append((csv_file, symbol, confidence))
            print(f"  🎯 Suggested: {symbol} (confidence: {confidence:.1%})\n")
        else:
            print(f"  ❓ Could not determine symbol\n")
    
    # Sort by confidence and assign
    assignments.sort(key=lambda x: x[2], reverse=True)
    
    final_assignments = {}
    used_symbols = set()
    
    for csv_file, symbol, confidence in assignments:
        if symbol not in used_symbols and symbol in remaining_symbols:
            final_assignments[csv_file] = symbol
            used_symbols.add(symbol)
            remaining_symbols.remove(symbol)
    
    # Convert files
    print("Converting files:")
    print("-" * 20)
    
    successful = 0
    for csv_file, symbol in final_assignments.items():
        print(f"\n📊 {csv_file.name} → {symbol}")
        output_file = datasets_dir / f"{symbol}.csv"
        
        if convert_csv_file(csv_file, output_file, symbol):
            successful += 1
    
    print(f"\n🎉 Conversion complete: {successful}/{len(final_assignments)} successful")
    
    # Show final status
    print("\n📋 Final dataset status:")
    print("-" * 25)
    
    all_symbols = ["AAPL", "GOOGL", "MSFT", "TSLA", "AMZN", "META", "NVDA", "NFLX", "TSMC", "SPY"]
    available_count = 0
    
    for symbol in all_symbols:
        csv_file = datasets_dir / f"{symbol}.csv"
        if csv_file.exists():
            # Check file size to ensure it's not empty
            try:
                df_check = pd.read_csv(csv_file)
                rows = len(df_check)
                date_range = f"{df_check['date'].min()} to {df_check['date'].max()}"
                print(f"✅ {symbol}: {rows} rows ({date_range})")
                available_count += 1
            except:
                print(f"⚠️  {symbol}: File exists but may be corrupted")
        else:
            print(f"❌ {symbol}: No dataset")
    
    print(f"\n📊 Summary: {available_count}/10 stocks have datasets")
    
    if available_count >= 5:
        print("🚀 Ready to test! You can now run the application.")
    else:
        print("⚠️  You may need more datasets for full functionality.")

if __name__ == "__main__":
    main()