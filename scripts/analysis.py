import json
import csv
from io import StringIO
from statistics import mean, median, stdev
from collections import Counter

def analyze_csv_data(content: str) -> dict:
    """Analyze CSV data and return statistics"""
    lines = content.strip().split('\n')
    
    if len(lines) < 2:
        raise ValueError("Invalid CSV format")
    
    reader = csv.DictReader(StringIO(content))
    rows = list(reader)
    headers = reader.fieldnames
    
    if not headers:
        raise ValueError("No headers found in CSV")
    
    column_analysis = []
    
    for header in headers:
        values = [row[header] for row in rows if row[header] and row[header].strip()]
        
        numeric_values = []
        for v in values:
            try:
                numeric_values.append(float(v))
            except ValueError:
                pass
        
        is_numeric = len(numeric_values) > len(values) * 0.5 if values else False
        
        if is_numeric and numeric_values:
            sorted_vals = sorted(numeric_values)
            n = len(numeric_values)
            
            mean_val = sum(numeric_values) / n
            median_val = sorted_vals[n // 2]
            min_val = min(numeric_values)
            max_val = max(numeric_values)
            
            variance = sum((x - mean_val) ** 2 for x in numeric_values) / n
            std_val = variance ** 0.5
            
            q1 = sorted_vals[int(n * 0.25)]
            q3 = sorted_vals[int(n * 0.75)]
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            outliers = [v for v in numeric_values if v < lower_bound or v > upper_bound]
            
            unique_numeric_values = list(set(numeric_values))
            value_counts_numeric = Counter(numeric_values)
            most_common_numeric = value_counts_numeric.most_common(1)[0][0] if value_counts_numeric else None
            
            column_analysis.append({
                'column': header,
                'type': 'Numeric',
                'count': len(numeric_values),
                'missing': len(values) - len(numeric_values),
                'mean': round(mean_val, 2),
                'median': round(median_val, 2),
                'std': round(std_val, 2),
                'min': round(min_val, 2),
                'max': round(max_val, 2),
                'outliers': len(outliers),
                'outlierPercentage': round((len(outliers) / len(numeric_values)) * 100, 2) if numeric_values else 0,
                'unique': len(unique_numeric_values),
                'mostCommon': most_common_numeric,
                'valueCounts': dict(value_counts_numeric)
            })
        else:
            unique_values = list(set(values))
            value_counts = Counter(values)
            most_common = value_counts.most_common(1)[0][0] if value_counts else None
            
            column_analysis.append({
                'column': header,
                'type': 'Categorical',
                'count': len(values),
                'missing': len(rows) - len(values),
                'unique': len(unique_values),
                'mostCommon': most_common,
                'valueCounts': dict(value_counts)
            })
    
    numeric_cols = [c for c in column_analysis if c['type'] == 'Numeric']
    correlations = []
    
    for i in range(len(numeric_cols)):
        for j in range(i + 1, len(numeric_cols)):
            col1_name = numeric_cols[i]['column']
            col2_name = numeric_cols[j]['column']
            
            vals1, vals2 = [], []
            for row in rows:
                try:
                    val1_str = row.get(col1_name, '')
                    val2_str = row.get(col2_name, '')
                    
                    # Skip rows with missing or empty values
                    if not val1_str or not val2_str or val1_str.strip() == '' or val2_str.strip() == '':
                        continue
                    
                    v1 = float(val1_str)
                    v2 = float(val2_str)
                    vals1.append(v1)
                    vals2.append(v2)
                except (ValueError, TypeError, KeyError):
                    pass
            
            if len(vals1) > 0:
                mean1 = sum(vals1) / len(vals1)
                mean2 = sum(vals2) / len(vals2)
                
                numerator = sum((vals1[k] - mean1) * (vals2[k] - mean2) for k in range(len(vals1)))
                denom1 = sum((v - mean1) ** 2 for v in vals1)
                denom2 = sum((v - mean2) ** 2 for v in vals2)
                
                if denom1 > 0 and denom2 > 0:
                    correlation = numerator / (denom1 * denom2) ** 0.5
                    
                    if abs(correlation) > 0.1:
                        correlations.append({
                            'pair': f"{col1_name} & {col2_name}",
                            'correlation': round(correlation, 3)
                        })
    
    correlations.sort(key=lambda x: abs(x['correlation']), reverse=True)
    
    null_values = [
        {
            'column': c['column'],
            'count': c['missing'],
            'percentage': round((c['missing'] / len(rows)) * 100, 2) if c['missing'] > 0 else 0
        }
        for c in column_analysis if c['missing'] > 0
    ]
    
    row_strs = [json.dumps(row, sort_keys=True) for row in rows]
    unique_rows = len(set(row_strs))
    duplicate_rows = len(row_strs) - unique_rows
    
    return {
        'totalRows': len(rows),
        'totalColumns': len(headers),
        'numericColumns': len([c for c in column_analysis if c['type'] == 'Numeric']),
        'categoricalColumns': len([c for c in column_analysis if c['type'] == 'Categorical']),
        'missingValues': round((sum(c['missing'] for c in column_analysis) / (len(rows) * len(headers))) * 100, 2) if rows and headers else 0,
        'duplicateRows': duplicate_rows,
        'nullValues': sorted(null_values, key=lambda x: x['count'], reverse=True)[:10],
        'statisticalSummary': [c for c in column_analysis if c['type'] == 'Numeric'][:10],
        'categoricalSummary': [c for c in column_analysis if c['type'] == 'Categorical'][:10],
        'dataTypes': [{'column': c['column'], 'type': c['type'], 'count': c['count']} for c in column_analysis],
        'outliers': [
            {
                'column': c['column'],
                'outlierCount': c['outliers'],
                'percentage': c['outlierPercentage']
            }
            for c in column_analysis if c['type'] == 'Numeric' and c['outliers'] > 0
        ],
        'correlations': correlations[:10],
        'columnAnalysis': column_analysis
    }

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        csv_file = sys.argv[1]
        with open(csv_file, 'r') as f:
            content = f.read()
        result = analyze_csv_data(content)
        print(json.dumps(result))
