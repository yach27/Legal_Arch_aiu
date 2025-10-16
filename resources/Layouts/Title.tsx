// eslint-disable-next-line react/prop-types
const Title = ({ title, des }) => {
    return (
        <div className="flex flex-col gap-4  mb-14">
            <h3 className="text-sm uppercase font-Bold text-[#003A18] tracking-wide">
                {title}
            </h3>
            <h1 className="text-4xl md:text-3xl text-gray-500 font-bold capitalize">
                {des}
            </h1>
        </div>
    );
};

export default Title;
