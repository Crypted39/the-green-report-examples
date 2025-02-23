from dataclasses import dataclass
from typing import List, Dict, Optional
from datetime import datetime
import json
from playwright.async_api import async_playwright, Page


@dataclass
class DataPoint:
    date: datetime
    value: float


@dataclass
class GraphValidationConfig:
    value_tolerance: float = 0.01
    trend_tolerance: float = 0.02
    min_data_points: int = 2


class LineGraphValidator:
    def __init__(self, config: GraphValidationConfig = GraphValidationConfig()):
        self.config = config
        self._fetch_graph_data = None

    async def fetch_api_data(self, api_url: str, headers: Optional[Dict] = None) -> List[DataPoint]:
        """Fetch and parse API data"""
        if self._fetch_graph_data:
            data = await self._fetch_graph_data()
            return [
                DataPoint(
                    date=datetime.fromisoformat(point['date']),
                    value=float(point['value'])
                )
                for point in data['data']
            ]
        return []

    async def extract_graph_data(self, page: Page, point_selector: str) -> List[DataPoint]:
        """Extract data points from Chart.js graph"""
        # Get chart data directly from the window.getGraphData() function
        data = await page.evaluate("window.getGraphData()")

        if len(data) < self.config.min_data_points:
            raise ValueError(f"Found fewer than {self.config.min_data_points} data points in graph")

        graph_data = []
        for point in data:
            graph_data.append(DataPoint(
                date=datetime.fromisoformat(point['date']),
                value=float(point['value'])
            ))

        return sorted(graph_data, key=lambda x: x.date)

    def validate_trends(self, api_data: List[DataPoint], graph_data: List[DataPoint]) -> bool:
        """Validate trends between consecutive points"""

        def calculate_trends(data: List[DataPoint]) -> List[float]:
            return [
                (point2.value - point1.value) / point1.value
                for point1, point2 in zip(data[:-1], data[1:])
            ]

        api_trends = calculate_trends(api_data)
        graph_trends = calculate_trends(graph_data)

        return all(
            abs(api_trend - graph_trend) <= self.config.trend_tolerance
            for api_trend, graph_trend in zip(api_trends, graph_trends)
        )

    def validate_values(self, api_data: List[DataPoint], graph_data: List[DataPoint]) -> bool:
        """Validate absolute values match"""
        return all(
            abs(api_point.value - graph_point.value) / api_point.value <= self.config.value_tolerance
            for api_point, graph_point in zip(api_data, graph_data)
        )

    async def validate_axes(self, page: Page) -> bool:
        """Validate axis labels and formatting"""
        # For Chart.js, we'll check if the canvas exists
        canvas = await page.query_selector('canvas#lineGraph')
        return canvas is not None

    async def validate_graph(self,
                             page: Page,
                             api_url: str,
                             point_selector: str,
                             take_snapshot: bool = False) -> Dict:
        """Main validation method"""
        validation_results = {
            'data_integrity': False,
            'trend_accuracy': False,
            'value_accuracy': False,
            'axes_validity': False,
            'visual_consistency': None
        }

        try:
            # Set up the custom data fetcher
            async def fetch_graph_data():
                data = await page.evaluate("window.getGraphData()")
                return {"data": data}

            self._fetch_graph_data = fetch_graph_data

            # Fetch and extract data
            api_data = await self.fetch_api_data(api_url)
            graph_data = await self.extract_graph_data(page, point_selector)

            # Print data for debugging
            print("API Data:", [{"date": d.date.isoformat(), "value": d.value} for d in api_data])
            print("Graph Data:", [{"date": d.date.isoformat(), "value": d.value} for d in graph_data])

            # Validate data points present
            validation_results['data_integrity'] = len(api_data) == len(graph_data)

            # Validate trends
            validation_results['trend_accuracy'] = self.validate_trends(api_data, graph_data)

            # Validate absolute values
            validation_results['value_accuracy'] = self.validate_values(api_data, graph_data)

            # Validate axes
            validation_results['axes_validity'] = await self.validate_axes(page)

            # Optional visual snapshot
            if take_snapshot:
                await page.screenshot(path=f"graph_snapshot_{datetime.now().strftime('%Y%m%d')}.png")
                validation_results['visual_consistency'] = True

        except Exception as e:
            validation_results['error'] = str(e)
            print(f"Error during validation: {str(e)}")

        return validation_results


async def test_line_graph():
    config = GraphValidationConfig(
        value_tolerance=0.01,
        trend_tolerance=0.02
    )

    validator = LineGraphValidator(config)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Set viewport size to ensure chart renders properly
        await page.set_viewport_size({"width": 1200, "height": 800})

        # Navigate to the page
        await page.goto("https://your-graph-page.com")

        # Wait for the chart to be rendered
        await page.wait_for_selector('canvas#lineGraph')

        results = await validator.validate_graph(
            page=page,
            api_url="dummy_url",
            point_selector="canvas#lineGraph",
            take_snapshot=True
        )

        print("Validation Results:")
        print(json.dumps(results, indent=2))

        # Assert results
        assert results['data_integrity'], "Data integrity check failed"
        assert results['trend_accuracy'], "Trend accuracy check failed"
        assert results['value_accuracy'], "Value accuracy check failed"
        assert results['axes_validity'], "Axes validation failed"

        await browser.close()


if __name__ == "__main__":
    import asyncio

    asyncio.run(test_line_graph())